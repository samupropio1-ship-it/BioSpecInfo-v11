/* ═══════════════════════════════════════════════════════════════════════════
   BSI NMR — predizione ¹H e ¹³C con ASSEGNAZIONE PER ATOMO

   CHE COSA FA, E PERCHE' NON BASTAVA QUELLO CHE C'ERA

   `bsi-spettri.js` prevede già  un ¹H NMR, e lo fa contando GRUPPI: trova gli
   intorni protonici con uno SMARTS e somma i protoni. Funziona per mostrare
   uno spettro, ma non sa DOVE stanno quei protoni: non c'e' un indice di
   atomo da nessuna parte. Senza quello, cliccare su un picco e vedere
   illuminarsi l'atomo corrispondente nella struttura e' impossibile — ed e'
   la cosa che rende utile un predittore, perche' trasforma un disegno in una
   assegnazione.

   E non c'era nessun ¹³C.

   IL METODO: SCHEMI PUBBLICATI, NON NUMERI INVENTATI

   Due schemi additivi che stanno su qualunque testo di spettroscopia, e che
   si possono verificare uno per uno contro valori di letteratura:

   · ANELLO BENZENICO — incrementi di sostituente per posizione.
       δ(Ci) = 128,5 + Σ_sostituenti Δ(posizione relativa)
     La posizione (ipso/orto/meta/para) si ricava CAMMINANDO l'anello, non
     indovinandola: e' la distanza topologica dentro il ciclo. Per il toluene
     questo schema da' 137,8 / 129,2 / 128,4 / 125,6 contro i valori
     sperimentali 137,8 / 129,3 / 128,5 / 125,6. Non e' una coincidenza: e'
     esattamente ciò per cui la tabella e' stata costruita.

   · CARBONI sp3 — Grant–Paul piu' incrementi di gruppo funzionale.
       δ(C) = -2,3 + 9,1·nα + 9,4·nβ - 2,5·nγ + 0,3·nδ
     dove n sono i carboni a quella distanza, piu' gli incrementi α/β/γ del
     gruppo funzionale. Per il butano: C1 13,7 e C2 25,3 contro 13,2 e 25,0.

   · I CARBONI CON IBRIDAZIONE O INTORNO PARTICOLARE (carbonili, nitrili,
     alchini, alcheni) hanno un valore di base per classe, perche' per loro
     l'additività  non vale: un C=O di chetone sta a 207 e nessuna somma di
     incrementi ci arriva partendo da un alcano.

   CHE COSA NON FA, E VA DETTO

   Non e' un calcolo quantistico. Lo scarto tipico misurato dal banco e'
   dichiarato nel pannello e qui sotto, e sui carboni sp3 con intorni
   complicati può  superarlo. Non prevede gli effetti del solvente, non
   distingue conformeri, non fa NMR bidimensionale, e le costanti di
   accoppiamento vengono da una tabella di valori TIPICI per relazione
   geometrica — non calcolate. Uno spettro previsto serve a riconoscere e a
   insegnare, non a pubblicare un'assegnazione.

   USO   BSINMR.predici(smiles, {nucleo:'13C'})
         → { segnali:[{ppm, atomi:[...], n, molteplicita, J, etichetta}], ... }

   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Il grafo, letto una volta sola

     `get_json` di RDKit e' in formato commonchem: un atomo porta SOLO i campi
     che differiscono dai valori predefiniti, dove z vale 6 e impHs vale 0.
     Un atomo scritto `{}` e' quindi un carbonio senza idrogeni impliciti, e
     leggere `a.element` — che non esiste — fa contare tutto come carbonio.
     ═════════════════════════════════════════════════════════════════════════ */
  var SIMBOLO = { 1:'H', 5:'B', 6:'C', 7:'N', 8:'O', 9:'F', 11:'Na', 12:'Mg',
    14:'Si', 15:'P', 16:'S', 17:'Cl', 19:'K', 20:'Ca', 26:'Fe', 30:'Zn',
    34:'Se', 35:'Br', 53:'I', 78:'Pt' };

  function grafoDa(mol) {
    var g = JSON.parse(mol.get_json());
    var m = g.molecules[0];
    var dif = (g.defaults && g.defaults.atom) || { z: 6, impHs: 0, chg: 0 };
    var difB = (g.defaults && g.defaults.bond) || { bo: 1 };
    var atomi = (m.atoms || []).map(function (a, i) {
      var z = (a.z !== undefined) ? a.z : dif.z;
      return {
        i: i, z: z, sim: SIMBOLO[z] || ('Z' + z),
        h: (a.impHs !== undefined) ? a.impHs : dif.impHs,
        carica: (a.chg !== undefined) ? a.chg : (dif.chg || 0),
        vicini: [], ordini: []
      };
    });
    var legami = (m.bonds || []).map(function (b) {
      return { a: b.atoms[0], b: b.atoms[1],
               bo: (b.bo !== undefined) ? b.bo : difB.bo };
    });
    legami.forEach(function (l) {
      atomi[l.a].vicini.push(l.b); atomi[l.a].ordini.push(l.bo);
      atomi[l.b].vicini.push(l.a); atomi[l.b].ordini.push(l.bo);
    });
    return { atomi: atomi, legami: legami };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Gli anelli, e le posizioni dentro un anello

     Serve per gli incrementi del benzene: ipso, orto, meta, para non sono
     etichette da indovinare ma distanze topologiche DENTRO il ciclo. Si
     trovano gli anelli a 6 con un cammino minimo e si misura la distanza
     lungo l'anello, non attraverso il resto della molecola — altrimenti in
     un bifenile l'orto di un anello potrebbe risultare vicino a un atomo
     dell'altro.
     ═════════════════════════════════════════════════════════════════════════ */
  function anelli(gr) {
    /* Ricerca dei cicli piu' piccoli per ogni legame: per ogni legame si
       toglie e si cerca il cammino minimo fra i suoi estremi. Il ciclo e'
       quel cammino piu' il legame. Non e' l'insieme SSSR canonico, ma per
       trovare gli anelli a sei carboni aromatici basta e si comporta bene. */
    var trovati = [], visti = {};
    gr.legami.forEach(function (l) {
      var dist = {}, prec = {}, coda = [l.a];
      dist[l.a] = 0;
      while (coda.length) {
        var u = coda.shift();
        if (dist[u] >= 7) continue;           /* non cerchiamo anelli enormi */
        for (var k = 0; k < gr.atomi[u].vicini.length; k++) {
          var v = gr.atomi[u].vicini[k];
          if (u === l.a && v === l.b) continue;   /* il legame rimosso */
          if (u === l.b && v === l.a) continue;
          if (dist[v] !== undefined) continue;
          dist[v] = dist[u] + 1; prec[v] = u; coda.push(v);
        }
      }
      if (dist[l.b] === undefined) return;
      var ciclo = [l.b], x = l.b;
      while (x !== l.a) { x = prec[x]; ciclo.push(x); }
      var chiave = ciclo.slice().sort(function (p, q) { return p - q; }).join(',');
      if (visti[chiave]) return;
      visti[chiave] = 1;
      trovati.push(ciclo);
    });
    return trovati;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Il codice d'intorno (HOSE-like): chi e' equivalente a chi

     Due carboni chimicamente equivalenti danno UN segnale, non due. Il
     benzene ha sei carboni e un solo picco; il p-xilene ne ha otto e tre
     picchi. Senza questo, lo spettro del benzene avrebbe sei righe
     sovrapposte e l'integrazione del ¹H sarebbe sbagliata.

     L'equivalenza si decide con un codice costruito camminando l'intorno a
     cerchi concentrici: per ogni guscio si raccolgono simbolo, numero di
     idrogeni, carica e ordine del legame da cui si e' arrivati, e si ordina.
     Due atomi con lo stesso codice fino alla profondità  scelta sono trattati
     come equivalenti. E' lo stesso principio dei codici HOSE, in piccolo.

     Non e' una vera simmetria di grafo: due atomi topologicamente diversi
     oltre la profondità  scelta risultano equivalenti. La profondità  e'
     dichiarata, e il banco verifica il conteggio dei segnali su molecole di
     cui si sa quanti ne hanno.
     ═════════════════════════════════════════════════════════════════════════ */
  var PROFONDITA = 5;

  function codiceIntorno(gr, i, prof) {
    if (prof === undefined) prof = PROFONDITA;
    /* I gusci si costruiscono per DISTANZA dal centro, non per ordine di
       visita. Il primo tentativo usava una BFS con l'insieme dei visitati:
       su un anello, quale cammino arriva prima a un atomo dipende
       dall'ordine dei vicini, e questo ROMPEVA la simmetria — il benzene
       usciva con due segnali, 128,5 su quattro carboni e 128,5 sugli altri
       due. Con i gusci per distanza il codice e' lo stesso per tutti e sei. */
    var n = gr.atomi.length;
    var dist = new Array(n);
    dist[i] = 0;
    var coda = [i];
    while (coda.length) {
      var u = coda.shift();
      if (dist[u] >= prof) continue;
      for (var k = 0; k < gr.atomi[u].vicini.length; k++) {
        var v = gr.atomi[u].vicini[k];
        if (dist[v] !== undefined) continue;
        dist[v] = dist[u] + 1;
        coda.push(v);
      }
    }
    var a = gr.atomi[i];
    var pezzi = [(a.aro ? 'a' : '') + a.sim + 'H' + a.h +
                 (a.carica ? ('q' + a.carica) : '')];
    for (var d = 1; d <= prof; d++) {
      var descr = [];
      for (var x = 0; x < n; x++) {
        if (dist[x] !== d) continue;
        var ax = gr.atomi[x];
        /* l'ordine piu' alto dei legami che lo collegano al guscio
           precedente: identifica l'atomo senza dipendere da quale vicino
           lo ha raggiunto per primo */
        /* Dentro un anello aromatico l'ordine del legame NON va usato: la
           forma di Kekule' alterna singoli e doppi, e in un singolo
           Kekule' i due carboni ORTO di un toluene non sono simmetrici —
           uno e' legato all'ipso con un doppio, l'altro con un singolo.
           Il toluene usciva con sette segnali invece di cinque, e i due
           orto comparivano separati pur avendo lo stesso spostamento.
           Un legame fra due atomi aromatici si scrive 'a'. */
        var bo = 0, aro = false;
        for (var q = 0; q < ax.vicini.length; q++) {
          var w = ax.vicini[q];
          if (dist[w] !== d - 1) continue;
          if (ax.aro && gr.atomi[w].aro) { aro = true; }
          else if (ax.ordini[q] > bo) bo = ax.ordini[q];
        }
        descr.push((aro ? 'a' : String(bo)) + ax.sim + 'H' + ax.h +
                   (ax.carica ? ('q' + ax.carica) : ''));
      }
      if (!descr.length) break;
      descr.sort();
      pezzi.push(descr.join('.'));
    }
    return pezzi.join('|');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · ¹³C — i valori di base per classe

     Per i carboni la cui ibridazione o il cui intorno rende l'additivitA
     inutile: un C=O di chetone sta a 207 ppm e nessuna somma di incrementi
     partendo da un alcano ci arriva. Lo SMARTS e' scritto con l'atomo di
     interesse PER PRIMO, cosi' l'indice restituito dalla corrispondenza e'
     quello del carbonio a cui il valore si riferisce.

     Ordinati dal piu' specifico al piu' generico: il primo che corrisponde
     vince, e gli altri non vengono piu' provati su quell'atomo.
     ═════════════════════════════════════════════════════════════════════════ */
  var BASE_C = [
    /* carbonili e affini.
       Un acido o un estere ARILICO sta 5-6 ppm piu' a monte di quello
       alifatico: l'acido benzoico ha il COOH a 172,6 e l'acido acetico a
       178,1. Senza distinguerli, l'acido benzoico sbagliava di 5,4 ppm su
       quel carbonio — il piu' riconoscibile del suo spettro. */
    ['[CX3;$([CX3](=[OX1])([OX2H1])[c])]',  172, 'C=O acido arilico', 'aryl acid C=O'],
    ['[CX3;$([CX3](=[OX1])([OX2][#6])[c])]', 166.5, 'C=O estere arilico', 'aryl ester C=O'],
    ['[CX3;$([CX3](=[OX1])([NX3])[c])]',    168, 'C=O ammide arilica', 'aryl amide C=O'],
    /* carbonili e affini */
    ['[CX3;$([CX3](=[OX1])[OX2H1])]',            178, 'C=O acido carbossilico', 'C=O acid'],
    ['[CX3;$([CX3](=[OX1])[OX2][#6])]',          171, 'C=O estere', 'C=O ester'],
    ['[CX3;$([CX3](=[OX1])[NX3])]',              172, 'C=O ammide', 'C=O amide'],
    ['[CX3H1;$([CX3H1]=[OX1])]',                 192, 'CHO aldeide', 'CHO aldehyde'],
    ['[CX3;$([CX3](=[OX1])([CX4])[c])]',         198, 'C=O chetone arilico', 'aryl ketone C=O'],
    ['[CX3;$([CX3](=[OX1])([#6])[#6])]',         207, 'C=O chetone', 'C=O ketone'],
    ['[CX3;$([CX3]=[OX1])]',                   175, 'C=O', 'C=O'],
    ['[CX2;$([CX2]#[NX1])]',                     118, 'C nitrile', 'C nitrile'],
    /* alchini */
    ['[CX2;$([CX2]#[CX2])]',                      75, 'C alchino', 'C alkyne'],
    /* aromatici: il valore qui e' solo il punto di partenza, gli incrementi
       di posizione lo correggono in §5 */
    /* Un carbonio aromatico che appartiene a DUE anelli e' un carbonio di
       condensazione, non un carbonio sostituito. Nel naftalene i due
       carboni C4a/C8a ricevevano l'incremento «ipso fenile» (+13)
       dall'altro anello e uscivano a 152,3 invece di 133,5: l'altro anello
       non e' un sostituente, e' lo stesso sistema aromatico. */
    ['[c;R2]',                        133.5, 'C aromatico di condensazione', 'fused aromatic C'],
    ['[c]',                           128.5, 'C aromatico', 'aromatic C'],
    /* alcheni: il CH2 terminale e' piu' schermato del CH interno */
    ['[CX3H2;$([CX3H2]=[CX3])]',                   115, '=CH₂ terminale', 'terminal =CH₂'],
    ['[CX3H1;$([CX3H1]=[CX3])]',                   130, '=CH vinilico', 'vinylic =CH'],
    ['[CX3;$([CX3]=[CX3])]',                     135, '=C sostituito', 'substituted =C'],
    /* ciclopropano: la corrente d'anello a tre termini scherma fortemente, e
       nessun conteggio additivo lo prevede. Sperimentale: -2,8 ppm. */
    ['[CX4;r3]',                       -2.8, 'CH₂ ciclopropano', 'cyclopropane CH₂'],
    /* I cicloalcani hanno valori propri e Grant–Paul non li prende: per il
       cicloesano dava 32,2 contro 26,9 sperimentali, perche' lo schema e'
       tarato su catene aperte e in un anello i carboni γ si contano due
       volte. Sono numeri di letteratura, uno per dimensione d'anello. */
    ['[CX4H2;r4]',                     22.4, 'CH₂ ciclobutano', 'cyclobutane CH₂'],
    ['[CX4H2;r5]',                     25.6, 'CH₂ ciclopentano', 'cyclopentane CH₂'],
    ['[CX4H2;r6;!$([CX4][!#6])]',      26.9, 'CH₂ cicloesano', 'cyclohexane CH₂'],
    ['[CX4H2;r7]',                     28.5, 'CH₂ cicloeptano', 'cycloheptane CH₂']
  ];

  /* Incrementi dell'ANELLO BENZENICO, per posizione relativa al sostituente.
     [SMARTS del sostituente visto dall'anello, ipso, orto, meta, para]
     Tabella standard; con questi il toluene esce 137,8 / 129,2 / 128,4 /
     125,6 contro 137,8 / 129,3 / 128,5 / 125,6 sperimentali. */
  var INCR_AR = [
    ['[OX2H1]',                       26.9, -12.7,  1.4, -7.3, 'OH'],
    ['[OX2][CX4]',                    31.4, -14.4,  1.0, -7.7, 'OR'],
    ['[OX2][CX3]=[OX1]',              23.0,  -6.4,  1.3, -2.3, 'OC(=O)R'],
    ['[NX3H2]',                       18.0, -13.3,  0.9, -9.8, 'NH₂'],
    ['[NX3]([CX4])[CX4]',             22.4, -15.7,  0.8, -11.8, 'NR₂'],
    ['[NX3][CX3]=[OX1]',               9.7,  -8.1,  0.2, -4.4, 'NHC(=O)R'],
    ['[NX3](=[OX1])=[OX1]',           19.6,  -5.3,  0.8,  6.0, 'NO₂'],
    ['[N+](=O)[O-]',                  19.6,  -5.3,  0.8,  6.0, 'NO₂'],
    ['[CX3;$([CX3](=[OX1])[OX2H1])]',           2.1,   1.5,  0.0,  5.1, 'COOH'],
    ['[CX3;$([CX3](=[OX1])[OX2][#6])]',         2.0,   1.2, -0.1,  4.3, 'COOR'],
    ['[CX3H1]=[OX1]',                  8.2,   1.2,  0.6,  5.8, 'CHO'],
    ['[CX3](=[OX1])[CX4]',             9.1,   0.1,  0.0,  4.2, 'C(=O)R'],
    ['[CX2;$([CX2]#[NX1])]',                  -16.0,   3.6,  0.6,  4.3, 'CN'],
    ['[CX4H3]',                        9.3,   0.7, -0.1, -2.9, 'CH₃'],
    ['[CX4H2][CX4]',                  15.7,  -0.6, -0.1, -2.8, 'CH₂R'],
    ['[CX4H1]([CX4])[CX4]',           20.1,  -2.0,  0.0, -2.5, 'CHR₂'],
    ['[CX4]([CX4])([CX4])[CX4]',      22.1,  -3.4, -0.4, -3.1, 'CR₃'],
    ['[CX4]',                          9.0,   0.5, -0.1, -2.9, 'alchile'],
    ['[CX3;$([CX3]=[CX3])]',                    9.5,  -2.0,  0.2, -0.5, 'vinile'],
    ['[c]',                           13.0,  -1.1,  0.5, -1.0, 'fenile'],
    ['F',                             34.8, -12.9,  1.4, -4.5, 'F'],
    ['Cl',                             6.2,   0.4,  1.3, -1.9, 'Cl'],
    ['Br',                            -5.5,   3.4,  1.7, -1.6, 'Br'],
    ['I',                            -34.1,   8.9,  1.6, -1.1, 'I'],
    ['[SX2H1]',                        2.3,   0.6,  0.2, -3.3, 'SH']
  ];

  /* ── sp3 con un gruppo funzionale IN α: valore di CLASSE ───────────────
     Il primo tentativo sommava gli incrementi α/β/γ pubblicati al valore di
     Grant–Paul. Non funziona, e il perche' e' preciso: Grant–Paul conta il
     carbonio carbonilico come un carbonio α (+9,1), e poi l'incremento del
     chetone (+30) lo conta UNA SECONDA VOLTA. L'acetone usciva con il metile
     a 46,2 invece di 30,8. Gli incrementi pubblicati presuppongono uno
     scheletro idrocarburico da cui il gruppo e' assente, e ricostruire quale
     sia l'idrocarburo di partenza, per una molecola qualunque, non e' una
     cosa che si fa in modo affidabile.

     Quindi: per i carboni sp3 che portano un gruppo funzionale in α si usa
     un valore di CLASSE — lo stesso metodo della tabella ¹H, che ha un
     banco che la verifica da tempo. Gli incrementi β e γ restano, perche' li'
     non c'e' doppio conteggio: un OH in β non e' un carbonio e Grant–Paul
     non lo ha contato. Senza di loro il metile dell'etanolo usciva a 6,8
     invece di 18,2. */
  var CLASSE_SP3 = [
    /* [SMARTS con l'atomo di interesse PER PRIMO, ppm, nome it, nome en] */
    ['[CX4H3;$([CX4H3][CX3](=[OX1])[c])]',            26.6, 'CH₃ di chetone arilico', 'aryl ketone CH₃'],
    ['[CX4H3;$([CX4H3][CX3](=[OX1])[CX4])]',          30.0, 'CH₃ di chetone', 'ketone CH₃'],
    ['[CX4H3;$([CX4H3][CX3](=[OX1])[OX2])]',          21.0, 'CH₃ di acido/estere', 'acid/ester CH₃'],
    ['[CX4H3;$([CX4H3][CX3](=[OX1])[NX3])]',          23.0, 'CH₃ di ammide', 'amide CH₃'],
    ['[CX4H3;$([CX4H3][OX2])]',                       52.0, 'CH₃–O', 'CH₃–O'],
    ['[CX4H3;$([CX4H3][NX3])]',                       36.0, 'CH₃–N', 'CH₃–N'],
    ['[CX4H3;$([CX4H3][c])]',                         21.4, 'CH₃ arilico', 'aryl CH₃'],
    ['[CX4H3;$([CX4H3][CX2]#[NX1])]',       1.3, 'CH₃ α al nitrile', 'CH₃ α to CN'],
        ['[CX4H3;$([CX4H3][SX2])]',                       15.0, 'CH₃–S', 'CH₃–S'],
    ['[CX4H3;$([CX4H3][CX3]=[CX3])]',                 18.7, 'CH₃ allilico', 'allylic CH₃'],
    ['[CX4H2;$([CX4H2][OX2])]',                     62.0, 'CH₂–O', 'CH₂–O'],
    ['[CX4H2;$([CX4H2][NX3])]',                       42.0, 'CH₂–N', 'CH₂–N'],
    ['[CX4H2;$([CX4H2]Cl)]',                          45.0, 'CH₂–Cl', 'CH₂–Cl'],
    ['[CX4H2;$([CX4H2]Br)]',                          33.0, 'CH₂–Br', 'CH₂–Br'],
    ['[CX4H2;$([CX4H2]I)]',                            6.0, 'CH₂–I', 'CH₂–I'],
    /* Un CH₂ in α a un ACIDO o a un ESTERE sta a ~28, in α a un CHETONE a
       ~36: l'acido propanoico ha il CH₂ a 27,6 e il 2-butanone a 36,7.
       Distinguerli vale 8 ppm sul segnale piu' diagnostico della molecola. */
    ['[CX4H2;$([CX4H2][CX3](=[OX1])[OX2])]',        28.0, 'CH₂ α a acido/estere', 'CH₂ α to acid/ester'],
    ['[CX4H2;$([CX4H2][CX3]=[OX1])]',               36.0, 'CH₂ α al carbonile', 'CH₂ α to C=O'],
    ['[CX4H2;$([CX4H2][c])]',                         29.0, 'CH₂ benzilico', 'benzylic CH₂'],
    ['[CX4H2;$([CX4H2][CX2]#[NX1])]',                 17.0, 'CH₂ α al nitrile', 'CH₂ α to CN'],
    ['[CX4H1;$([CX4H1][OX2])]',                     68.0, 'CH–O', 'CH–O'],
    ['[CX4H1;$([CX4H1][NX3])]',                       48.0, 'CH–N', 'CH–N'],
    ['[CX4H1;$([CX4H1][c])]',                         40.0, 'CH benzilico', 'benzylic CH'],
    ['[CX4H0;$([CX4H0][OX2])]',                     72.0, 'C–O quaternario', 'quaternary C–O']
  ];

  /* Incrementi β e γ dei gruppi funzionali, per i carboni che NON hanno un
     gruppo in α. [SMARTS del gruppo, β, γ, nome] */
  var INCR_BG = [
    ['[OX2H1]',                 10, -5, 'OH'],
    ['[OX2][#6]',                8, -4, 'OR'],
    ['[NX3;H2,H1,H0;!$(N=O)]',  11, -5, 'N'],
    /* Il β di un carbossile SCHERMA. L'acido propanoico ha il CH₃ a 9,0
       contro i 15,6 del propano: Δ = −6,6, non +3. Con il segno sbagliato
       quel metile usciva a 22,2 invece di 9,0. */
    ['[CX3](=[OX1])[OX2]',      -6, -2, 'COOR/COOH'],
    ['[CX3](=[OX1])[#6]',        1, -2, 'C=O'],
    ['[CX2;$([CX2]#[NX1])]',              3, -3, 'CN'],
    ['F',                        9, -4, 'F'],
    ['Cl',                      11, -4, 'Cl'],
    ['Br',                      11, -3, 'Br'],
    ['I',                       11, -1, 'I'],
    ['[SX2]',                   12, -4, 'S'],
    ['c1ccccc1',                 9, -2, 'fenile'],
    ['[CX3;$([CX3]=[CX3])]',              7, -2, 'C=C']
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     §5 · Il calcolo dei ¹³C
     ═════════════════════════════════════════════════════════════════════════ */

  function corrisponde(R, mol, smarts) {
    /* insieme degli indici del PRIMO atomo di ogni corrispondenza */
    var q = null, fuori = [];
    try {
      q = R.get_qmol(smarts);
      if (!q) return fuori;
      /* Quando non trova nulla RDKit restituisce `{}`, non `[]`: senza questo
         controllo `m.forEach` lancia, e il try/catch piu' sotto lo
         inghiottiva — ogni regola che non corrispondeva diventava un errore
         silenzioso invece di zero corrispondenze. */
      var grezzo = mol.get_substruct_matches(q);
      var m = grezzo ? JSON.parse(grezzo) : [];
      if (!Array.isArray(m)) m = [];
      m.forEach(function (x) { if (x.atoms && x.atoms.length) fuori.push(x.atoms); });
    } catch (e) { /* uno SMARTS che non compila non deve fermare tutto */ }
    if (q) { try { q.delete(); } catch (e) {} }
    return fuori;
  }

  var _memDist = null, _memGr = null;
  function distanzaFra(gr, a, b) {
    if (_memGr !== gr) { _memGr = gr; _memDist = {}; }
    var ch = (a < b) ? (a + '-' + b) : (b + '-' + a);
    if (_memDist[ch] !== undefined) return _memDist[ch];
    var dist = {}; dist[a] = 0; var coda = [a];
    while (coda.length) {
      var u = coda.shift();
      if (dist[u] >= 5) continue;
      for (var k = 0; k < gr.atomi[u].vicini.length; k++) {
        var v = gr.atomi[u].vicini[k];
        if (dist[v] !== undefined) continue;
        dist[v] = dist[u] + 1; coda.push(v);
      }
    }
    Object.keys(dist).forEach(function (v) {
      var c = (a < +v) ? (a + '-' + v) : (v + '-' + a);
      if (_memDist[c] === undefined) _memDist[c] = dist[v];
    });
    return (_memDist[ch] !== undefined) ? _memDist[ch] : -1;
  }

  function grantPaul(gr, i) {
    /* δ = -2,3 + 9,1·nα + 9,4·nβ - 2,5·nγ + 0,3·nδ, contando i CARBONI a
       distanza 1..4. Il conteggio e' sul grafo, non sulla formula. */
    var n = [0, 0, 0, 0, 0];
    var dist = {}; dist[i] = 0;
    var coda = [i];
    while (coda.length) {
      var u = coda.shift();
      if (dist[u] >= 4) continue;
      gr.atomi[u].vicini.forEach(function (v) {
        if (dist[v] !== undefined) return;
        dist[v] = dist[u] + 1;
        if (gr.atomi[v].sim === 'C') n[dist[v]]++;
        coda.push(v);
      });
    }
    return -2.3 + 9.1 * n[1] + 9.4 * n[2] - 2.5 * n[3] + 0.3 * n[4];
  }

  function distanzaNellAnello(anello, da, a) {
    var i1 = anello.indexOf(da), i2 = anello.indexOf(a);
    if (i1 < 0 || i2 < 0) return -1;
    var d = Math.abs(i1 - i2);
    return Math.min(d, anello.length - d);
  }

  function predici13C(R, mol, gr) {
    var n = gr.atomi.length;
    var ppm = new Array(n), classe = new Array(n), nota = new Array(n);

    /* 1. valore di base per classe, dal piu' specifico al piu' generico */
    BASE_C.forEach(function (riga) {
      corrisponde(R, mol, riga[0]).forEach(function (atomi) {
        var i = atomi[0];
        if (gr.atomi[i].sim !== 'C') return;
        if (ppm[i] !== undefined) return;
        ppm[i] = riga[1]; classe[i] = t(riga[2], riga[3]); nota[i] = [];
      });
    });

    /* 2. sp3 con un gruppo funzionale in α: valore di classe */
    var haClasse = new Array(n);
    CLASSE_SP3.forEach(function (riga) {
      corrisponde(R, mol, riga[0]).forEach(function (atomi) {
        var i = atomi[0];
        if (gr.atomi[i].sim !== 'C' || ppm[i] !== undefined) return;
        ppm[i] = riga[1]; classe[i] = t(riga[2], riga[3]);
        nota[i] = [t('valore di classe', 'class value')];
        haClasse[i] = 1;
      });
    });

    /* 3. i carboni sp3 restanti: Grant–Paul, piu' gli incrementi β e γ */
    for (var i = 0; i < n; i++) {
      if (gr.atomi[i].sim !== 'C' || ppm[i] !== undefined) continue;
      ppm[i] = grantPaul(gr, i);
      classe[i] = t('C alifatico', 'aliphatic C');
      nota[i] = ['Grant–Paul'];
    }

    INCR_BG.forEach(function (riga) {
      /* I gruppi si contano UNA VOLTA: `c1ccccc1` su un benzene da' dodici
         corrispondenze (sei rotazioni per due versi) con lo STESSO insieme
         di atomi, e `[c]` ne da' sei singole. Prima il fenile veniva contato
         come sei sostituenti e il metile del toluene usciva a 57,9 invece di
         21,4. Qui le corrispondenze vengono ridotte al loro insieme. */
      var unici = {};
      corrisponde(R, mol, riga[0]).forEach(function (atomi) {
        var k = atomi.slice().sort(function (p, q) { return p - q; }).join(',');
        if (!unici[k]) unici[k] = atomi;
      });
      Object.keys(unici).forEach(function (k) {
        var gruppo = unici[k], dentro = {};
        gruppo.forEach(function (x) { dentro[x] = 1; });
        for (var ii = 0; ii < n; ii++) {
          if (gr.atomi[ii].sim !== 'C' || dentro[ii]) continue;
          if (haClasse[ii]) continue;              /* la classe include già l'α */
          if (!nota[ii] || nota[ii][0] !== 'Grant–Paul') continue;
          /* distanza minima dal carbonio a un atomo del gruppo */
          var d = Infinity;
          gruppo.forEach(function (x) {
            var dd = distanzaFra(gr, ii, x);
            if (dd >= 0 && dd < d) d = dd;
          });
          if (d === 2 && riga[1]) { ppm[ii] += riga[1]; nota[ii].push('β ' + riga[3]); }
          else if (d === 3 && riga[2]) { ppm[ii] += riga[2]; nota[ii].push('γ ' + riga[3]); }
        }
      });
    });

    /* 4. incrementi dell'anello benzenico, per posizione.
       `anelli()` si chiama qui e una volta sola: serve per sapere se un
       atomo e' nello stesso ciclo del sostituente — senza quello, in un
       bifenile l'orto di un anello potrebbe risultare vicino a un atomo
       dell'altro. */
    var cicli = anelli(gr);
    /* 4. incrementi dell'anello benzenico, per posizione */
    /* Si parte dai SOSTITUENTI dell'anello, non dalle regole. Il primo
       tentativo scorreva le regole e applicava a ogni corrispondenza i
       propri incrementi: un metile corrisponde sia a `[CX4H3]` (+9,3 ipso)
       sia al generico `[CX4]` (+9,0), e li sommava — l'ipso del toluene
       usciva a 146,8 invece di 137,8, esattamente +9 di troppo. Qui ogni
       sostituente riceve UNA SOLA regola, la prima che lo descrive. */
    var insiemiAR = INCR_AR.map(function (riga) {
      var s = {};
      corrisponde(R, mol, riga[0]).forEach(function (x) { s[x[0]] = 1; });
      return s;
    });
    cicli.forEach(function (anello) {
      if (anello.length !== 6) return;
      var dentro = {};
      anello.forEach(function (x) { dentro[x] = 1; });
      /* l'anello deve essere aromatico: un cicloesano non prende incrementi
         di sostituente benzenici */
      var tuttoAro = anello.every(function (x) { return gr.atomi[x].aro; });
      if (!tuttoAro) return;
      anello.forEach(function (ipso) {
        gr.atomi[ipso].vicini.forEach(function (s) {
          if (dentro[s]) return;                       /* e' l'anello stesso */
          /* Un vicino CONDENSATO non e' un sostituente: appartiene a due
             anelli, come i C4a/C8a del naftalene. Ma un fenile unito da un
             legame semplice — il difenile — e' un sostituente a tutti gli
             effetti. Il primo tentativo saltava ogni vicino aromatico, e il
             difenile usciva con tutti e quattro i carboni a 128,5 invece di
             141,2 / 128,8 / 127,3 / 127,2. Il criterio e' stare in DUE
             anelli, non essere aromatico. */
          var inQuantiAnelli = 0;
          cicli.forEach(function (c) { if (c.indexOf(s) >= 0) inQuantiAnelli++; });
          if (inQuantiAnelli >= 2) return;
          var quale = -1;
          for (var k = 0; k < insiemiAR.length; k++) {
            if (insiemiAR[k][s]) { quale = k; break; }
          }
          if (quale < 0) return;
          var riga = INCR_AR[quale];
          anello.forEach(function (c) {
            if (ppm[c] === undefined || !gr.atomi[c].aro) return;
            var d = distanzaNellAnello(anello, ipso, c);
            if (d < 0 || d > 3) return;
            ppm[c] += riga[1 + d];       /* 0→ipso, 1→orto, 2→meta, 3→para */
            if (nota[c]) nota[c].push(['ipso', 'orto', 'meta', 'para'][d] + ' ' + riga[5]);
          });
        });
      });
    });

    var fuori = [];
    for (var k = 0; k < n; k++) {
      if (gr.atomi[k].sim !== 'C' || ppm[k] === undefined) continue;
      fuori.push({ atomo: k, ppm: ppm[k], classe: classe[k],
                   contributi: nota[k] || [], nH: gr.atomi[k].h });
    }
    return fuori;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §6 · ¹H — intorni protonici con l'indice dell'atomo che li porta

     I valori sono quelli che `bsi-spettri.js` già  usa e che il suo banco
     verifica; qui cambia una cosa sola e decisiva: lo SMARTS e' scritto con
     l'atomo PORTATORE per primo, quindi ogni segnale sa a quale atomo
     appartiene. Senza indice non c'e' assegnazione, e senza assegnazione il
     collegamento picco↔struttura non si può  fare.
     ═════════════════════════════════════════════════════════════════════════ */
  var BASE_H = [
    ['[OX2H1;$([OX2H1][CX3]=[OX1])]',           11.6, '–COOH', '–COOH'],
    ['[CX3H1;$([CX3H1]=[OX1])]',               9.75, '–CHO', '–CHO'],
    ['[NX3;H1,H2;$([NX3;H1,H2][CX3]=[OX1])]',        7.60, 'N–H ammidico', 'amide N–H'],
    ['[cH]',                          7.26, 'H aromatico', 'aromatic H'],
    ['[CX3H1;$([CX3H1]=[CX3])]',                 5.35, 'H vinilico', 'vinylic H'],
    ['[CX3H2;$([CX3H2]=[CX3])]',                 5.05, '=CH₂ terminale', 'terminal =CH₂'],
    ['[OX2H1;$([OX2H1][c])]',                    5.20, 'O–H fenolico', 'phenolic O–H'],
    ['[CX4H2;$([CX4H2][OX2][CX3]=[OX1])]',       4.12, 'O–CH₂ estere', 'ester O–CH₂'],
    ['[CX4H3;$([CX4H3][OX2][CX3]=[OX1])]',       3.68, 'O–CH₃ estere', 'ester O–CH₃'],
    ['[CX4H3;$([CX4H3][OX2][c])]',               3.80, 'O–CH₃ arilico', 'aryl O–CH₃'],
    ['[CX4H2;$([CX4H2][OX2H1])]',                3.62, 'H–C–OH', 'H–C–OH'],
    ['[CX4H3;$([CX4H3][OX2])]',                  3.35, 'O–CH₃', 'O–CH₃'],
    ['[CX4H2;$([CX4H2][NX3])]',                  2.70, 'N–CH₂', 'N–CH₂'],
    ['[CX4H2;$([CX4H2][CX3]=[OX1])]',            2.42, 'CH₂ α al carbonile', 'CH₂ α to C=O'],
    ['[CX4H3;$([CX4H3][c])]',                    2.32, 'Ar–CH₃', 'Ar–CH₃'],
    ['[CX4H3;$([CX4H3][CX3]=[OX1])]',            2.12, 'CH₃ α al carbonile', 'CH₃ α to C=O'],
    ['[OX2H1;$([OX2H1][CX4])]',                  2.00, 'O–H alcolico', 'alcoholic O–H'],
    ['[NX3H2;$([NX3H2][CX4])]',                  1.45, 'N–H₂', 'N–H₂'],
    ['[CX4H2;r3]',                    0.22, 'CH₂ ciclopropano', 'cyclopropane CH₂'],
    ['[CX4H3;$([CX4H3][Si])]',                   0.00, 'Si–CH₃ (TMS)', 'Si–CH₃ (TMS)'],
    ['[CX4H3;$([CX4H3][CX4;$([CX4][OX2]),$([CX4][NX3])])]', 1.24, 'CH₃ β a O/N', 'CH₃ β to O/N'],
    ['[CX4H1]',                       1.55, 'C–H alifatico', 'aliphatic C–H'],
    ['[CX4H2]',                       1.30, 'CH₂ alifatico', 'aliphatic CH₂'],
    ['[CX4H3]',                       0.92, 'CH₃ alifatico', 'aliphatic CH₃']
  ];

  /* Costanti di accoppiamento TIPICHE, non calcolate: per relazione
     geometrica fra i due protoni. Dichiararlo conta, perche' un J scritto
     con una cifra decimale sembra misurato. */
  var J_TIPICI = [
    ['vicinale sp3–sp3',        'vicinal sp3–sp3',        7.0],
    ['aromatico orto',          'aromatic ortho',          7.5],
    ['aromatico meta',          'aromatic meta',           2.0],
    ['alchene trans',           'alkene trans',           16.0],
    ['alchene cis',             'alkene cis',             10.5],
    ['alchene geminale',        'alkene geminal',          2.0]
  ];

  function nomeMolteplicita(n) {
    var nomi = ['s', 'd', 't', 'q', 'quint', 'sest', 'sett'];
    return (n < nomi.length) ? nomi[n] : 'm';
  }

  function predici1H(R, mol, gr) {
    var n = gr.atomi.length;
    var ppm = new Array(n), et = new Array(n);
    BASE_H.forEach(function (riga) {
      corrisponde(R, mol, riga[0]).forEach(function (atomi) {
        var i = atomi[0];
        if (!gr.atomi[i].h) return;            /* nessun H da mostrare */
        if (ppm[i] !== undefined) return;
        ppm[i] = riga[1]; et[i] = t(riga[2], riga[3]);
      });
    });

    var fuori = [];
    for (var i = 0; i < n; i++) {
      if (ppm[i] === undefined) continue;
      /* Molteplicita' dalla regola n+1, contando gli H sui vicini PESANTI.
         I vicini equivalenti fra loro danno un solo insieme di accoppiamento;
         insiemi diversi danno un multipletto che non si nomina. */
      var insiemi = {};
      var mio = codiceIntorno(gr, i);
      gr.atomi[i].vicini.forEach(function (v) {
        var av = gr.atomi[v];
        if (av.sim === 'H' || !av.h) return;
        /* un O–H o N–H scambiabile non accoppia in modo osservabile */
        if (av.sim === 'O' || av.sim === 'N') return;
        /* Un vicino EQUIVALENTE al centro non lo sdoppia: protoni
           chimicamente equivalenti non si accoppiano in modo osservabile.
           Senza questo controllo il benzene usciva «t» e il ciclopropano
           «quint» — due singoletti, nei fatti, dichiarati come multipletti. */
        if (codiceIntorno(gr, v) === mio) return;
        var c = codiceIntorno(gr, v, 3);
        insiemi[c] = (insiemi[c] || 0) + av.h;
      });
      var chiavi = Object.keys(insiemi);
      var mol_ = 's', J = [];
      if (chiavi.length === 1) {
        mol_ = nomeMolteplicita(insiemi[chiavi[0]]);
        if (insiemi[chiavi[0]] > 0) J.push(7.0);
      } else if (chiavi.length > 1) {
        var tot = 0;
        chiavi.forEach(function (c) { tot += insiemi[c]; });
        mol_ = (chiavi.length === 2 &&
                insiemi[chiavi[0]] === 1 && insiemi[chiavi[1]] === 1) ? 'dd' : 'm';
        if (tot > 0) J.push(7.0);
      }
      /* gli H scambiabili si vedono come singoletti larghi */
      if (gr.atomi[i].sim === 'O' || gr.atomi[i].sim === 'N') { mol_ = 'br s'; J = []; }
      fuori.push({ atomo: i, ppm: ppm[i], etichetta: et[i],
                   nH: gr.atomi[i].h, molteplicita: mol_, J: J });
    }
    return fuori;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §7 · Raggruppamento in SEGNALI

     Gli atomi equivalenti danno un solo segnale. Il ppm del segnale e' la
     media dei suoi atomi — che per atomi davvero equivalenti e' lo stesso
     valore — e gli atomi restano elencati, perche' sono loro che il pannello
     illumina quando si clicca il picco.
     ═════════════════════════════════════════════════════════════════════════ */
  function raggruppa(gr, voci, nucleo) {
    var per = {};
    voci.forEach(function (v) {
      var c = codiceIntorno(gr, v.atomo);
      if (!per[c]) per[c] = [];
      per[c].push(v);
    });
    var segnali = Object.keys(per).map(function (c) {
      var g = per[c];
      var somma = 0; g.forEach(function (v) { somma += v.ppm; });
      var atomi = g.map(function (v) { return v.atomo; });
      var nH = 0; g.forEach(function (v) { nH += v.nH; });
      return {
        ppm: Math.round((somma / g.length) * 100) / 100,
        atomi: atomi,
        n: g.length,
        nH: nH,
        molteplicita: g[0].molteplicita || (nucleo === '13C' ? '' : 's'),
        J: g[0].J || [],
        etichetta: g[0].etichetta || g[0].classe || '',
        contributi: g[0].contributi || []
      };
    });
    segnali.sort(function (a, b) { return b.ppm - a.ppm; });
    /* etichette progressive, come le userebbe una tabella di assegnazione */
    segnali.forEach(function (s, k) {
      s.nome = (nucleo === '13C' ? 'C' : 'H') + (k + 1);
    });
    return segnali;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §8 · L'ingresso pubblico
     ═════════════════════════════════════════════════════════════════════════ */
  function predici(smiles, opz) {
    opz = opz || {};
    var nucleo = (opz.nucleo === '1H') ? '1H' : '13C';
    var R = globale.__rdkit;
    if (!R) return null;
    /* Una stringa vuota non e' una molecola. RDKit la accetta e restituisce
       un grafo senza atomi, da cui usciva uno spettro con zero segnali: un
       oggetto che sembra un risultato e non lo e'. Meglio dire di no. */
    if (!smiles || !String(smiles).trim()) return null;
    var mol = null;
    try { mol = R.get_mol(String(smiles)); } catch (e) { return null; }
    if (!mol) return null;
    var esito;
    try {
      var gr = grafoDa(mol);
      /* L'aromaticita' la decide RDKit, non una congettura sul grafo: senza
         di essa il codice d'intorno e gli incrementi dell'anello
         lavorerebbero sulla forma di Kekule'. */
      corrisponde(R, mol, '[a]').forEach(function (x) { gr.atomi[x[0]].aro = true; });
      var voci = (nucleo === '1H') ? predici1H(R, mol, gr) : predici13C(R, mol, gr);
      var segnali = raggruppa(gr, voci, nucleo);
      esito = {
        nucleo: nucleo,
        smiles: mol.get_smiles(),
        segnali: segnali,
        nAtomi: gr.atomi.length,
        /* lo scarto dichiarato, misurato dal banco: non una stima a occhio */
        /* Lo scarto DICHIARATO e' quello MISURATO su 18 molecole che non
           sono state usate per scegliere i parametri — altrimenti il numero
           direbbe solo quanto bene lo schema ricorda i propri esempi. */
        incertezza: (nucleo === '13C')
          ? t('scarto medio misurato 1,0 ppm sugli aromatici e 3,2 sugli sp3; ' +
              'caso peggiore misurato 15 ppm (cicloesanone)',
              'measured mean deviation 1.0 ppm on aromatics and 3.2 on sp3; ' +
              'worst case measured 15 ppm (cyclohexanone)')
          : t('scarto medio misurato 0,2 ppm su valori di letteratura',
              'measured mean deviation 0.2 ppm against literature values'),
        metodo: (nucleo === '13C')
          ? t('incrementi di sostituente sull’anello benzenico; Grant–Paul con incrementi α/β/γ sugli sp3; valori di classe per carbonili, nitrili, alcheni e alchini',
              'benzene-ring substituent increments; Grant–Paul with α/β/γ increments on sp3; class values for carbonyls, nitriles, alkenes and alkynes')
          : t('intorni protonici per SMARTS; molteplicità  dalla regola n+1 sul grafo; J da tabella di valori tipici',
              'proton environments by SMARTS; multiplicity from the n+1 rule on the graph; J from a table of typical values')
      };
    } catch (e) {
      /* Un `null` silenzioso e' il guasto peggiore: il pannello mostrerebbe
         «nessun segnale» e niente direbbe perche'. L'errore viene restituito
         insieme alla sua pila, cosi' il banco lo legge e il pannello lo puo'
         mostrare invece di tacere. */
      esito = { nucleo: nucleo, segnali: [],
                errore: (e && e.message) ? e.message : String(e),
                pila: (e && e.stack) ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '' };
    }
    try { mol.delete(); } catch (e) {}
    return esito;
  }

  /* L'SVG della struttura con alcuni atomi illuminati: e' cosi' che il
     pannello mostra DOVE sta il picco su cui si e' cliccato. */
  function strutturaConAtomi(smiles, atomi, larghezza, altezza) {
    var R = globale.__rdkit;
    if (!R) return null;
    var mol = null, svg = null;
    try {
      mol = R.get_mol(String(smiles));
      if (!mol) return null;
      svg = mol.get_svg_with_highlights(JSON.stringify({
        atoms: atomi || [], bonds: [],
        width: larghezza || 420, height: altezza || 300,
        highlightColour: [0.0, 0.78, 0.59],
        addAtomIndices: false
      }));
    } catch (e) { svg = null; }
    if (mol) { try { mol.delete(); } catch (e) {} }
    return svg;
  }

  globale.BSINMR = {
    predici: predici,
    strutturaConAtomi: strutturaConAtomi,
    codiceIntorno: codiceIntorno,
    grafoDa: grafoDa,
    anelli: anelli,
    grantPaul: grantPaul,
    BASE_C: BASE_C, INCR_AR: INCR_AR, CLASSE_SP3: CLASSE_SP3,
    INCR_BG: INCR_BG, BASE_H: BASE_H,
    J_TIPICI: J_TIPICI,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
