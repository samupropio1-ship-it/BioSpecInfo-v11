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

   Le TABELLE stanno in `bsi-pretsch.js`, trascritte intere dalla fonte; qui
   sta il ragionamento che le usa. Gli schemi sono quattro:

   · ANELLO BENZENICO — incrementi di sostituente per posizione.
       δ(Ci) = 128,5 + Σ_sostituenti Zi      (¹³C, ~90 sostituenti)
       δ(Hi) = 7,34  + Σ_sostituenti Zi      (¹H,  ~65 sostituenti)
     La posizione (ipso/orto/meta/para) si ricava CAMMINANDO l'anello, non
     indovinandola: e' la distanza topologica dentro il ciclo. Per il toluene
     questo schema da' 137,8 / 129,2 / 128,4 / 125,6 contro i valori
     sperimentali 137,8 / 129,3 / 128,5 / 125,6, e per l'anisolo gli H a
     6,90 / 7,29 / 6,94 contro 6,89 / 7,27 / 6,93.

   · CARBONI ALIFATICI — lo schema additivo completo.
       δ(C) = -2,3 + Σ Zi + Σ Sj
     dove gli Zi sono gli incrementi dei sostituenti alla loro distanza
     (α, β, γ, δ) — e il carbonio di scheletro e' esso stesso un
     sostituente, con 9,1 / 9,4 / -2,5 / 0,3 — e gli Sj sono le correzioni
     steriche, una tabella 4×4 per grado del carbonio osservato e dell'atomo
     α. In un ANELLO carbociclico il valore di partenza diventa il
     cicloalcano parente, perche' li' la somma conterebbe i carboni girando
     dalle due parti.

   · ETILENI e ALCANI, per il ¹H.
       δ(C=CH) = 5,25 + Zgem + Zcis + Ztrans
       δ(CH₃)  = 0,86 + ΣZα + ΣZβ ;  δ(CH₂) = 1,37 + … ;  δ(CH) = 1,50 + …
     Un =CH₂ terminale porta due protoni NON equivalenti, uno cis e uno
     trans: lo stirene li ha a 5,74 e 5,23, e darne uno solo vuol dire
     sbagliarne almeno uno. Escono come due voci sullo stesso atomo.

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
    /* ── Gli ETEROAROMATICI hanno valori propri ───────────────────────────
       Il furano, il tiofene, il pirrolo e la piridina non sono benzeni con un
       sostituente: l'eteroatomo cambia gli spostamenti di decine di ppm e la
       tabella degli incrementi benzenici non li descrive. Senza queste righe
       i carboni del furano uscivano tutti a 128,5 contro i 142,7 e 109,6
       sperimentali — e in un quesito d'esame il furano si riconosce
       ESATTAMENTE da quei due numeri.
       Vanno prima di `[c;R2]` e `[c]`: il primo che corrisponde vince. */
    /* Un carbonio α del furano che PORTA un sostituente si descherma fino a
       ~150: è la regola che il manuale di Metodi Fisici enuncia così —
       «furano monosostituito: C–O deschermato ∼150» — e che si ritrova nel
       quesito del 23/04/2024, dove i due carboni furanici-O stanno a 150,77
       e 146,05. Senza questa riga uscivano entrambi a 142,7 e il confronto
       lasciava due segnali senza corrispondenza. Il β non ha un valore
       dichiarato nel manuale e resta quello del furano non sostituito: dove
       non c'è una fonte non si inventa un numero. */
    ['[c;r5;$(c:o);$(c-[!#1])]',      150.0, 'C α del furano sostituito', 'substituted furan α-C'],
    ['[c;r5;$(c:o)]',                 142.7, 'C α del furano', 'furan α-C'],
    ['[c;r5;$(c:c:o)]',               109.6, 'C β del furano', 'furan β-C'],
    ['[c;r5;$(c:s)]',                 125.4, 'C α del tiofene', 'thiophene α-C'],
    ['[c;r5;$(c:c:s)]',               127.2, 'C β del tiofene', 'thiophene β-C'],
    ['[c;r5;$(c:[nX3H1])]',           118.0, 'C α del pirrolo', 'pyrrole α-C'],
    ['[c;r5;$(c:c:[nX3H1])]',         108.0, 'C β del pirrolo', 'pyrrole β-C'],
    ['[c;r6;$(c:[nX2])]',             149.9, 'C α della piridina', 'pyridine α-C'],
    ['[c;r6;$(c:c:[nX2])]',           123.8, 'C β della piridina', 'pyridine β-C'],
    ['[c;r6;$(c:c:c:[nX2])]',         136.0, 'C γ della piridina', 'pyridine γ-C'],
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
    /* I CICLOALCANI non stanno piu' qui. Avevano un valore fisso per
       dimensione d'anello, e funzionava finche' l'anello era nudo: nel
       cicloesanone i due carboni in α al carbonile prendevano i 26,9 del
       cicloesano invece dei 41,9 misurati — quindici ppm sul segnale che
       dice dove sta il carbonile. Ora il cicloalcano e' il composto di
       RIFERIMENTO dello schema additivo (§5-bis), e il carbonio nudo
       riprende il suo valore per costruzione mentre i derivati seguono. */
    ['[CX3H0;$([CX3](=[CX3])([#6])[#6])]', 135, '=C tetrasostituito', 'tetrasubstituted =C']
  ];

  /* ── LE TABELLE NON STANNO PIU' QUI ─────────────────────────────────────
     Stavano qui: venticinque incrementi benzenici scelti a mano, venticinque
     «valori di classe» per i carboni sp3 e tredici incrementi β/γ. Erano un
     RIASSUNTO di tabelle piu' grandi, e dove il riassunto non arrivava il
     predittore restituiva il valore del composto nudo senza dirlo.

     Ora le tabelle INTERE stanno in `bsi-pretsch.js`, trascritte dalla fonte
     e controllabili riga per riga contro la pagina stampata. Qui resta il
     RAGIONAMENTO: trovare i sostituenti, misurare le distanze, sommare.

     Se quel modulo non e' stato caricato la predizione lo dice, invece di
     restituire numeri plausibili e sbagliati. */
  function tab() { return globale.BSIPretsch || null; }


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

  /* ═════════════════════════════════════════════════════════════════════════
     §5-bis · I GRUPPI FUNZIONALI, trovati una volta sola

     Lo schema additivo di Pretsch per i carboni alifatici dice:

         δ = -2,3 + Σ Zi + Σ Sj + Σ Kk

     dove gli Zi sono gli incrementi dei SOSTITUENTI alla loro distanza
     (α, β, γ, δ) e il semplice carbonio di scheletro è esso stesso un
     sostituente, con i suoi 9,1 / 9,4 / -2,5 / 0,3.

     LA TRAPPOLA, e perche' il tentativo precedente era fallito: un carbonio
     che FA PARTE di un gruppo funzionale non va contato anche come carbonio
     di scheletro. Nell'acetone il carbonio carbonilico vale 22,5 come
     gruppo «–CO–»; se lo si contasse ANCHE come carbonio α (+9,1), il metile
     uscirebbe a 38,7 invece di 30,8. E' esattamente l'errore che aveva
     portato ad abbandonare lo schema additivo in favore dei valori di
     classe. Qui i gruppi si trovano PRIMA, i loro atomi si marcano come
     «presi», e il conteggio dei carboni semplici li salta.

     I SISTEMI AROMATICI non si cercano con uno SMARTS ma sul grafo, come
     componenti connesse di atomi aromatici. Con `c1ccccc1` il naftalene da'
     due corrispondenze che si sovrappongono su due atomi, e un sostituente
     alifatico prenderebbe l'incremento del fenile due volte.
     ═════════════════════════════════════════════════════════════════════════ */

  /* quanti vicini NON idrogeno ha un atomo. Gli H impliciti non stanno nel
     grafo, quindi tutti i vicini sono pesanti; la funzione resta esplicita
     perche' uno SMILES con H espliciti e' legale. */
  function gradoPesante(gr, i) {
    var n = 0;
    gr.atomi[i].vicini.forEach(function (v) {
      if (gr.atomi[v].sim !== 'H') n++;
    });
    return n;
  }

  function sistemiAromatici(gr) {
    var visti = {}, fuori = [];
    for (var i = 0; i < gr.atomi.length; i++) {
      if (!gr.atomi[i].aro || visti[i]) continue;
      var comp = [], coda = [i];
      visti[i] = 1;
      while (coda.length) {
        var u = coda.shift();
        comp.push(u);
        gr.atomi[u].vicini.forEach(function (v) {
          if (gr.atomi[v].aro && !visti[v]) { visti[v] = 1; coda.push(v); }
        });
      }
      fuori.push(comp);
    }
    return fuori;
  }

  function gruppiFunzionali(R, mol, gr) {
    var P = tab();
    var presi = {}, fuori = [];
    if (!P) return { gruppi: fuori, presi: presi, anelloDi: {} };

    function aggiungi(atomi, Z, nome, asterisco, alt) {
      /* Una corrispondenza i cui atomi siano GIA' TUTTI presi e' la stessa
         cosa gia' descritta da una riga piu' specifica: si salta. Se invece
         ne ha anche uno solo di libero e' un gruppo nuovo — e' il caso dei
         due anelli condensati del naftalene, che condividono due atomi. */
      var libero = false;
      for (var q = 0; q < atomi.length; q++) if (!presi[atomi[q]]) libero = true;
      if (!libero) return;
      atomi.forEach(function (x) { presi[x] = 1; });
      /* `alt` descrive lo stesso gruppo visto dall'altro lato: [indice
         dell'atomo che la fa scattare, Zα, Zβ, Zγ, Zδ, nome]. L'indice e'
         quello nella corrispondenza, e qui diventa l'indice dell'ATOMO. */
      var altro = null;
      if (alt && atomi[alt[0]] !== undefined) {
        altro = { atomo: atomi[alt[0]], Z: [alt[1], alt[2], alt[3], alt[4]],
                  nome: alt[5] };
      }
      fuori.push({ atomi: atomi, Z: Z, nome: nome,
                   asterisco: !!asterisco, alt: altro });
    }

    sistemiAromatici(gr).forEach(function (comp) {
      aggiungi(comp, P.AROMATICO, 'arile', false);
    });

    /* L'anello CARBOCICLICO e NON aromatico piu' piccolo che contiene ogni
       atomo: e' il composto di riferimento del carbonio che ci sta dentro.
       Se l'anello contiene un eteroatomo o un carbonio aromatico il parente
       non e' un cicloalcano e il cambio di riferimento non si fa. */
    var anelloDi = {};
    anelli(gr).forEach(function (c) {
      if (c.length < 3 || c.length > 8) return;
      var buono = c.every(function (x) {
        return gr.atomi[x].sim === 'C' && !gr.atomi[x].aro;
      });
      if (!buono) return;
      c.forEach(function (x) {
        if (!anelloDi[x] || c.length < anelloDi[x].length) anelloDi[x] = c;
      });
    });

    P.ALIFATICI13C.forEach(function (riga) {
      var unici = {};
      corrisponde(R, mol, riga[0]).forEach(function (atomi) {
        var k = atomi.slice().sort(function (p, q) { return p - q; }).join(',');
        if (!unici[k]) unici[k] = atomi;
      });
      Object.keys(unici).forEach(function (k) {
        aggiungi(unici[k], [riga[1], riga[2], riga[3], riga[4]],
                 riga[5], riga[6], riga[7]);
      });
    });
    return { gruppi: fuori, presi: presi, anelloDi: anelloDi };
  }

  /* Le correzioni steriche Sj — Pretsch §4.1 p. 83. Righe: grado del carbonio
     OSSERVATO; colonne: numero di sostituenti non-idrogeno sull'atomo α.
     La tabella precedente ne conteneva quattro valori su sedici. */
  function sterico(mio, suo) {
    var P = tab();
    if (!P || mio < 1) return 0;
    var r = P.STERICI13C[Math.min(mio, 4)];
    if (!r) return 0;
    return r[Math.min(Math.max(suo, 1), 4) - 1];
  }

  function alifatico13C(gr, i, info) {
    var P = tab();
    if (!P) return { ppm: 0, note: ['tabelle non caricate'] };
    var somma = P.BASE_ALIF13C, note = [], S = 0;
    var mio = gradoPesante(gr, i);
    var ETICHETTA = ['α', 'β', 'γ', 'δ'];

    info.gruppi.forEach(function (g) {
      if (g.atomi.indexOf(i) >= 0) return;         /* il carbonio E' il gruppo */
      /* La distanza di un gruppo e' quella del suo atomo PIU' VICINO. Per un
         estere questo sceglie da solo il verso giusto: dal lato alchilico
         l'atomo piu' vicino e' l'ossigeno, dal lato acilico il carbonile —
         e le due tabelle (–OCO– 56,5 e –COO– 22,6) sono diverse di 34 ppm. */
      var d = 99, alfa = -1;
      g.atomi.forEach(function (x) {
        var dd = distanzaFra(gr, i, x);
        if (dd >= 0 && dd < d) { d = dd; alfa = x; }
      });
      if (d < 1 || d > 4) return;
      var Z = g.Z, nome = g.nome;
      if (g.alt && g.alt.atomo === alfa) { Z = g.alt.Z; nome = g.alt.nome; }
      var z = Z[d - 1];
      if (z) { somma += z; note.push(ETICHETTA[d - 1] + ' ' + nome); }
      if (d === 1 && g.asterisco) S += sterico(mio, gradoPesante(gr, alfa));
    });

    for (var x = 0; x < gr.atomi.length; x++) {
      if (x === i || gr.atomi[x].sim !== 'C' || info.presi[x]) continue;
      var d2 = distanzaFra(gr, i, x);
      if (d2 < 1 || d2 > 4) continue;
      somma += P.CARBONIO_SEMPLICE[d2 - 1];
      if (d2 === 1) S += sterico(mio, gradoPesante(gr, x));
    }

    if (S) { somma += S; note.push('S ' + (S > 0 ? '+' : '') + S.toFixed(1)); }
    /* Kk, le correzioni conformazionali, valgono 0: la conformazione da uno
       SMILES non si ricava, e inventarla sarebbe peggio che ometterla. */

    /* ── L'ANELLO CARBOCICLICO: si cambia composto di riferimento ──────────
       In un anello la somma additiva conta i carboni girando dalle due
       parti, e per il cicloesano da' 32,2 contro 26,9. Qui il valore di
       partenza diventa il cicloalcano parente e si TOLGONO gli incrementi
       dei carboni d'anello che il parente ha gia'. Per il cicloalcano nudo
       il conto torna esatto; per un suo derivato resta corretto, perche'
       cio' che e' cambiato e' solo cio' che si e' aggiunto. */
    var anello = info.anelloDi[i];
    if (anello) {
      var P2 = tab(), parente = P2.CICLOALCANI[anello.length];
      if (parente !== undefined) {
        var giaNelParente = 0;
        anello.forEach(function (j) {
          if (j === i) return;
          var dr = distanzaNellAnello(anello, i, j);
          if (dr >= 1 && dr <= 4) giaNelParente += P2.CARBONIO_SEMPLICE[dr - 1];
        });
        somma = parente + (somma - P2.BASE_ALIF13C) - giaNelParente;
        note.push('C' + anello.length + ' di riferimento');
      }
    }
    return { ppm: somma, note: note };
  }

  function distanzaNellAnello(anello, da, a) {
    var i1 = anello.indexOf(da), i2 = anello.indexOf(a);
    if (i1 < 0 || i2 < 0) return -1;
    var d = Math.abs(i1 - i2);
    return Math.min(d, anello.length - d);
  }

  /* Per ogni sostituente di un anello aromatico, l'indice della PRIMA riga
     della tabella che lo descrive. Si parte dai sostituenti e non dalle
     regole: un metile corrisponde sia a `[CX4H3]` sia al generico `[CX4]`, e
     sommando entrambi l'ipso del toluene usciva a 146,8 invece di 137,8. */
  function primaRigaChe(R, mol, tabella) {
    var mappa = {};
    for (var k = 0; k < tabella.length; k++) {
      /* Lo SMARTS si chiede in forma RICORSIVA, `[$(...)]`, che corrisponde
         al solo atomo CAPO dello schema.

         Il motivo e' una proprieta' di `get_substruct_matches` che costa cara
         se non la si conosce: le corrispondenze vengono rese uniche per
         INSIEME di atomi. Per `[CX3]=[CX3]` sullo stirene esiste un solo
         insieme {C0, C1}, e RDKit ne restituisce una sola orientazione — se
         il capo e' C0, l'atomo C1 non risulta mai capo di quello schema. Lo
         stirene perdeva cosi' l'incremento del vinile su tutti e cinque gli
         H aromatici, che restavano a 7,34 invece di 7,42 / 7,32 / 7,25.
         Nella forma ricorsiva ogni atomo viene provato per conto suo e la
         questione non si pone. */
      var teste = corrisponde(R, mol, '[$(' + tabella[k][0] + ')]');
      if (!teste.length) teste = corrisponde(R, mol, tabella[k][0]);
      for (var q = 0; q < teste.length; q++) {
        if (mappa[teste[q][0]] === undefined) mappa[teste[q][0]] = k;
      }
    }
    return mappa;
  }

  /* Applica una tabella di incrementi per posizione a tutti gli anelli
     aromatici a sei termini. `inizio` e' l'indice della prima colonna di
     incremento nella riga: 1 per il ¹³C (ipso, orto, meta, para) e 0 per il
     ¹H, che non ha l'ipso perche' l'ipso non porta idrogeni. */
  function incrementiDiAnello(R, mol, gr, cicli, tabella, inizio, applica) {
    var quale = primaRigaChe(R, mol, tabella);
    var nomi = (inizio === 1)
      ? ['ipso', 'orto', 'meta', 'para']
      : [null, 'orto', 'meta', 'para'];
    cicli.forEach(function (anello) {
      if (anello.length !== 6) return;
      var dentro = {};
      anello.forEach(function (x) { dentro[x] = 1; });
      var tuttoAro = anello.every(function (x) { return gr.atomi[x].aro; });
      if (!tuttoAro) return;
      anello.forEach(function (ipso) {
        gr.atomi[ipso].vicini.forEach(function (s) {
          if (dentro[s]) return;                       /* e' l'anello stesso */
          /* Un vicino che sta su un anello CONDENSATO a questo non e' un
             sostituente: e' lo stesso sistema aromatico. Ma un fenile unito
             da un legame semplice — il difenile — e' un sostituente a tutti
             gli effetti, e saltando ogni vicino aromatico il difenile
             usciva con tutti e quattro i carboni a 128,5 invece di 141,2 /
             128,8 / 127,3 / 127,2.

             Il criterio NON e' «stare in due anelli»: quello protegge i
             carboni di giunzione (C4a/C8a del naftalene) ma non i loro
             vicini. Nel naftalene il C8, che sta in un anello solo,
             risultava sostituente del C8a e gli regalava l'incremento ipso
             di un fenile: 147,5 invece di 133,5, quattordici ppm. Il
             criterio giusto e' che l'anello di `s` CONDIVIDA UN LEGAME con
             questo — due atomi in comune — cioe' che sia condensato. */
          var condensato = false;
          cicli.forEach(function (c) {
            if (condensato || c === anello || c.indexOf(s) < 0) return;
            var comuni = 0;
            c.forEach(function (x) { if (dentro[x]) comuni++; });
            if (comuni >= 2) condensato = true;
          });
          if (condensato) return;
          var k = quale[s];
          if (k === undefined) return;
          var riga = tabella[k];
          anello.forEach(function (c) {
            var d = distanzaNellAnello(anello, ipso, c);
            if (d < 0 || d > 3) return;
            if (inizio === 0 && d === 0) return;      /* l'ipso non ha H */
            /* La colonna e' `inizio + d`, e basta. La tabella ¹³C comincia
               dall'ipso (riga[1] = Z1), quella ¹H dall'orto (riga[1] = Z2):
               in entrambi i casi la distanza nell'anello piu' `inizio` da'
               l'indice giusto. Un aggiustamento in piu' faceva leggere a
               d = 1 l'elemento zero — lo SMARTS — e l'orto di ogni benzene
               monosostituito usciva NaN, mentre meta e para si scambiavano
               (il toluene dava il para a 7,25 e il meta a 7,17 invece del
               contrario). */
            var z = riga[inizio + d];
            if (typeof z !== 'number') return;
            applica(c, z, nomi[d] + ' ' + riga[riga.length - 1]);
          });
        });
      });
    });
  }

  function predici13C(R, mol, gr) {
    var P = tab();
    if (!P) throw new Error('bsi-pretsch.js non caricato: nessuna tabella di stima');
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

    /* 2. i carboni sp3 restanti: lo schema additivo completo */
    var info = gruppiFunzionali(R, mol, gr);
    for (var i = 0; i < n; i++) {
      if (gr.atomi[i].sim !== 'C' || ppm[i] !== undefined) continue;
      var r = alifatico13C(gr, i, info);
      ppm[i] = r.ppm;
      classe[i] = t('C alifatico', 'aliphatic C');
      nota[i] = r.note;
    }

    /* 3. incrementi dell'anello benzenico, per posizione */
    var cicli = anelli(gr);
    incrementiDiAnello(R, mol, gr, cicli, P.AR13C, 1, function (c, z, perche) {
      if (ppm[c] === undefined || !gr.atomi[c].aro) return;
      ppm[c] += z;
      if (nota[c]) nota[c].push(perche);
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
  /* ── Gli intorni che NON si costruiscono per incrementi ──────────────────
     Restano qui i protoni per cui una tabella additiva non esiste o non ha
     senso: gli scambiabili (OH, NH, COOH), il protone aldeidico, il
     ciclopropano (la corrente d'anello a tre termini scherma di un ppm e
     nessuna somma lo prevede) e il TMS, che vale zero per definizione.

     Tutto il resto — aromatici, vinilici, alchinici terminali, e ogni CH₃,
     CH₂ e CH alifatico — si CALCOLA, e piu' sotto si vede come. Prima erano
     ventiquattro valori fissi: un H aromatico valeva 7,26 che portasse un
     nitro o un metossile, e la benzaldeide sbagliava due dei suoi tre H
     aromatici di piu' di mezzo ppm. */
  var BASE_H = [
    ['[OX2H1;$([OX2H1][CX3]=[OX1])]',           11.6, '–COOH', '–COOH'],
    /* un aldeide ARILICA sta piu' a valle di una alifatica: la benzaldeide a
       10,02, l'acetaldeide a 9,80. Valori di letteratura, non stimati. */
    ['[CX3H1;$([CX3H1](=[OX1])[c])]',           9.98, '–CHO arilica', 'aryl –CHO'],
    ['[CX3H1;$([CX3H1]=[OX1])]',                9.75, '–CHO', '–CHO'],
    ['[NX3;H1,H2;$([NX3;H1,H2][CX3]=[OX1])]',   7.60, 'N–H ammidico', 'amide N–H'],
    ['[OX2H1;$([OX2H1][c])]',                   5.20, 'O–H fenolico', 'phenolic O–H'],
    ['[OX2H1;$([OX2H1][CX4])]',                 2.00, 'O–H alcolico', 'alcoholic O–H'],
    ['[NX3H2;$([NX3H2][CX4])]',                 1.45, 'N–H₂', 'N–H₂'],
    ['[CX4H2;r3]',                              0.22, 'CH₂ ciclopropano', 'cyclopropane CH₂'],
    ['[CX4H3;$([CX4H3][Si])]',                  0.00, 'Si–CH₃ (TMS)', 'Si–CH₃ (TMS)']
  ];

  /* Costanti di accoppiamento TIPICHE, non calcolate: per relazione
     geometrica fra i due protoni. Dichiararlo conta, perche' un J scritto
     con una cifra decimale sembra misurato. */
  /* Le costanti J per geometria, dalla tabella del manuale (§7.5). Sono
     intervalli di valori TIPICI, non calcoli: si riporta il centro e, dove
     serve, l'intervallo. */
  var J_TIPICI = [
    ['catena aperta, rotazione libera', 'open chain, free rotation', 7.0, '6–8'],
    ['aromatico orto',          'aromatic ortho',          8.0, '6–10'],
    ['aromatico meta',          'aromatic meta',           2.0, '1–3'],
    ['aromatico para',          'aromatic para',           0.5, '0–1'],
    ['alchene trans (E)',       'alkene trans (E)',       15.0, '12–18'],
    ['alchene cis (Z)',         'alkene cis (Z)',          9.0, '6–12'],
    ['cicloesano ax–ax',        'cyclohexane ax–ax',      10.5, '8–13'],
    ['cicloesano ax–eq / eq–eq','cyclohexane ax–eq / eq–eq', 3.5, '2–5'],
    ['ciclopentano cis / trans','cyclopentane cis / trans', 7.5, '6–9 / 2–5'],
    ['epossido cis / trans',    'epoxide cis / trans',     6.0, '5–7 / 2–3'],
    ['allilico (⁴J)',           'allylic (⁴J)',            1.5, '0–3'],
    ['furano, J cicliche',      'furan, ring J',           2.5, '1,5–3,5']
  ];

  function nomeMolteplicita(n) {
    var nomi = ['s', 'd', 't', 'q', 'quint', 'sest', 'sett'];
    return (n < nomi.length) ? nomi[n] : 'm';
  }

  /* ── ¹H degli alcani: δ = base(CH₃/CH₂/CH) + ΣZα + ΣZβ ───────────────────
     Gli Zβ si contano SOLO attraverso un carbonio sp3 semplice. Attraverso
     un eteroatomo no: nella tabella di Pretsch «O–C≤» e' gia' il sostituente
     α completo, e aggiungere il carbonio oltre l'ossigeno lo conterebbe due
     volte. */
  function alcano1H(gr, i, qualeAlcano) {
    var P = tab();
    var h = gr.atomi[i].h;
    if (!h || h > 3 || !P) return null;
    var col = (h === 3) ? 1 : (h === 2 ? 3 : 5);
    var somma = P.BASE_ALCANI1H[h], note = [];
    gr.atomi[i].vicini.forEach(function (v) {
      if (gr.atomi[v].sim === 'H') return;
      var k = qualeAlcano[v];
      if (k === undefined) return;
      var riga = P.ALCANI1H[k], nome = riga[riga.length - 1];
      somma += riga[col];
      if (riga[col]) note.push('α ' + nome);
      if (nome !== 'C≤') return;
      gr.atomi[v].vicini.forEach(function (w) {
        if (w === i || gr.atomi[w].sim === 'H') return;
        var k2 = qualeAlcano[w];
        if (k2 === undefined) return;
        var r2 = P.ALCANI1H[k2];
        somma += r2[col + 1];
        if (r2[col + 1]) note.push('β ' + r2[r2.length - 1]);
      });
    });
    return { ppm: somma, note: note };
  }

  function predici1H(R, mol, gr) {
    var P = tab();
    if (!P) throw new Error('bsi-pretsch.js non caricato: nessuna tabella di stima');
    var n = gr.atomi.length;
    var voci = [];
    var fatto = new Array(n);

    function metti(i, ppm, etichetta, sotto, note) {
      if (fatto[i] && !sotto) return;
      fatto[i] = 1;
      voci.push({ atomo: i, ppm: ppm, etichetta: etichetta,
                  sotto: sotto || '', contributi: note || [],
                  nH: sotto ? 1 : gr.atomi[i].h });
    }

    /* 1 · gli intorni speciali, dal piu' specifico al piu' generico */
    BASE_H.forEach(function (riga) {
      corrisponde(R, mol, riga[0]).forEach(function (atomi) {
        var i = atomi[0];
        if (!gr.atomi[i].h || fatto[i]) return;
        metti(i, riga[1], t(riga[2], riga[3]), '', []);
      });
    });

    /* 2 · gli H aromatici: 7,34 + Σ Zi, per posizione nell'anello */
    var cicli = anelli(gr);
    var ppmAr = {}, notaAr = {};
    for (var a = 0; a < n; a++) {
      if (gr.atomi[a].aro && gr.atomi[a].h && !fatto[a]) {
        ppmAr[a] = P.BASE_AR1H; notaAr[a] = [];
      }
    }
    incrementiDiAnello(R, mol, gr, cicli, P.AR1H, 0, function (c, z, perche) {
      if (ppmAr[c] === undefined) return;
      ppmAr[c] += z; notaAr[c].push(perche);
    });
    Object.keys(ppmAr).forEach(function (k) {
      metti(+k, ppmAr[k], t('H aromatico', 'aromatic H'), '', notaAr[k]);
    });

    /* 3 · gli H vinilici: 5,25 + Zgem + Zcis + Ztrans ──────────────────────
       Un =CH₂ terminale porta DUE protoni non equivalenti: uno cis e uno
       trans al sostituente dell'altro carbonio. Nello stirene stanno a 5,74
       e 5,23 — mezzo ppm di distanza — e darne uno solo vuol dire sbagliarne
       almeno uno. Qui escono come due voci sullo stesso atomo.

       Quando invece il protone e' uno solo e il sostituente di fronte
       potrebbe essere cis o trans, la geometria dallo SMILES senza
       stereochimica non si ricava: si prende la MEDIA dei due incrementi e
       lo si dichiara nei contributi. */
    var qualeEt = primaRigaChe(R, mol, P.ETILENE1H);
    for (var i = 0; i < n; i++) {
      if (fatto[i] || !gr.atomi[i].h || gr.atomi[i].aro) continue;
      if (gr.atomi[i].sim !== 'C') continue;
      var partner = -1;
      for (var q = 0; q < gr.atomi[i].vicini.length; q++) {
        if (gr.atomi[i].ordini[q] === 2 && gr.atomi[gr.atomi[i].vicini[q]].sim === 'C') {
          partner = gr.atomi[i].vicini[q];
        }
      }
      if (partner < 0) continue;
      var gem = 0, noteV = [];
      gr.atomi[i].vicini.forEach(function (v) {
        if (v === partner || gr.atomi[v].sim === 'H') return;
        var k = qualeEt[v];
        if (k === undefined) return;
        gem += P.ETILENE1H[k][1];
        noteV.push('gem ' + P.ETILENE1H[k][4]);
      });
      var cis = 0, trans = 0, aldiLa = [];
      gr.atomi[partner].vicini.forEach(function (v) {
        if (v === i || gr.atomi[v].sim === 'H') return;
        var k = qualeEt[v];
        if (k === undefined) return;
        cis += P.ETILENE1H[k][2];
        trans += P.ETILENE1H[k][3];
        aldiLa.push(P.ETILENE1H[k][4]);
      });
      if (gr.atomi[i].h === 2 && Math.abs(cis - trans) > 0.08) {
        metti(i, P.BASE_ETILENE1H + gem + cis,
              t('H vinilico', 'vinylic H'), 'cis',
              noteV.concat(aldiLa.map(function (x) { return 'cis ' + x; })));
        metti(i, P.BASE_ETILENE1H + gem + trans,
              t('H vinilico', 'vinylic H'), 'trans',
              noteV.concat(aldiLa.map(function (x) { return 'trans ' + x; })));
      } else {
        var media = (cis + trans) / 2;
        metti(i, P.BASE_ETILENE1H + gem + media, t('H vinilico', 'vinylic H'), '',
              noteV.concat(aldiLa.map(function (x) {
                return t('cis/trans mediati ', 'cis/trans averaged ') + x;
              })));
      }
    }

    /* 4 · gli H alchinici terminali: valore diretto per sostituente */
    var qualeAlchino = primaRigaChe(R, mol, P.ALCHINI1H);
    corrisponde(R, mol, '[CX2H1]#[CX2]').forEach(function (atomi) {
      var i = atomi[0], altro = atomi[1];
      if (fatto[i]) return;
      var v = 1.91, nome = 'H';
      gr.atomi[altro].vicini.forEach(function (w) {
        if (w === i || gr.atomi[w].sim === 'H') return;
        var k = qualeAlchino[w];
        if (k === undefined) return;
        v = P.ALCHINI1H[k][1]; nome = P.ALCHINI1H[k][2];
      });
      metti(i, v, t('≡C–H alchinico', 'alkyne ≡C–H'), '', ['R = ' + nome]);
    });

    /* 5 · tutti gli altri: lo schema degli alcani sostituiti */
    var qualeAlcano = primaRigaChe(R, mol, P.ALCANI1H);
    for (var j = 0; j < n; j++) {
      if (fatto[j] || !gr.atomi[j].h) continue;
      if (gr.atomi[j].sim !== 'C') continue;
      var r = alcano1H(gr, j, qualeAlcano);
      if (!r) continue;
      metti(j, r.ppm, t('H alifatico', 'aliphatic H'), '', r.note);
    }

    /* 6 · molteplicita' e J, per ogni voce */
    voci.forEach(function (voce) {
      var i = voce.atomo;
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
      /* i due protoni di un =CH₂ si accoppiano fra loro (²J geminale ~1-3 Hz)
         e con quello dell'altro carbonio: sono sempre almeno un doppietto */
      if (voce.sotto) { mol_ = 'dd'; J = [17.0, 1.5]; }
      /* gli H scambiabili si vedono come singoletti larghi */
      if (gr.atomi[i].sim === 'O' || gr.atomi[i].sim === 'N') { mol_ = 'br s'; J = []; }
      voce.molteplicita = mol_;
      voce.J = J;
    });
    return voci;
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
      /* La chiave comprende il «sotto»: i due protoni di un =CH₂ stanno
         sullo STESSO atomo e hanno quindi lo stesso codice d'intorno, ma
         sono cis e trans al sostituente di fronte e danno due segnali
         distinti. Senza questo pezzo di chiave si fonderebbero in uno solo
         con la media dei due — che non e' nessuno dei due. */
      var c = codiceIntorno(gr, v.atomo) + (v.sotto ? ('§' + v.sotto) : '');
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
        etichetta: (g[0].etichetta || g[0].classe || '') +
                   (g[0].sotto ? (' (' + g[0].sotto + ')') : ''),
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
          ? t('scarto medio misurato 0,7 ppm su 9 molecole di taratura e ' +
              '0,9 su 22 di validazione, mai usate per scegliere i parametri; ' +
              'caso peggiore misurato 4,9 ppm (cicloesanone). Il difenile ' +
              'sbaglia l\u2019ipso di 4,6 ppm: l\u2019incremento del fenile della ' +
              'tabella (8,1) non lo descrive, e non e\u2019 stato ritoccato per ' +
              'farlo tornare',
              'measured mean deviation 0.7 ppm over 9 tuning molecules and ' +
              '0.9 over 22 validation ones, never used to choose parameters; ' +
              'worst case measured 4.9 ppm (cyclohexanone). Biphenyl misses ' +
              'its ipso carbon by 4.6 ppm: the table\u2019s phenyl increment ' +
              '(8.1) does not describe it, and was not adjusted to make it fit')
          : t('scarto medio misurato 0,06 ppm su 14 molecole di letteratura, ' +
              '0,03 sui soli aromatici',
              'measured mean deviation 0.06 ppm over 14 literature molecules, ' +
              '0.03 on the aromatics alone'),
        metodo: (nucleo === '13C')
          ? t('tabelle di Pretsch: incrementi di sostituente sull’anello benzenico (δ = 128,5 + ΣZi) e schema additivo completo sugli alifatici (δ = −2,3 + ΣZi + ΣSj), con correzioni steriche 4×4; valori di classe per carbonili, nitrili, alcheni, alchini e cicloalcani',
              'Pretsch tables: benzene-ring substituent increments (δ = 128.5 + ΣZi) and the full additive scheme on aliphatics (δ = −2.3 + ΣZi + ΣSj) with the 4×4 steric corrections; class values for carbonyls, nitriles, alkenes, alkynes and cycloalkanes')
          : t('tabelle di Pretsch: aromatici δ = 7,34 + ΣZi, vinilici δ = 5,25 + Zgem + Zcis + Ztrans, alifatici δ = base(CH₃/CH₂/CH) + ΣZα + ΣZβ; molteplicità dalla regola n+1 sul grafo; J da tabella di valori tipici',
              'Pretsch tables: aromatics δ = 7.34 + ΣZi, vinylics δ = 5.25 + Zgem + Zcis + Ztrans, aliphatics δ = base(CH₃/CH₂/CH) + ΣZα + ΣZβ; multiplicity from the n+1 rule on the graph; J from a table of typical values'),
        fonte: tab() ? tab().fonte : ''
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
    sistemiAromatici: sistemiAromatici,
    gradoPesante: gradoPesante,
    sterico: sterico,
    BASE_C: BASE_C, BASE_H: BASE_H,
    J_TIPICI: J_TIPICI,
    /* le tabelle vere stanno in BSIPretsch; qui l'indirizzo, per chi legge */
    tabelle: function () { return tab(); },
    versione: '2.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
