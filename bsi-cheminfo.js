/* ═══════════════════════════════════════════════════════════════════════════
   BSI-CHEMINFO — banco di lavoro di chemioinformatica
   ═══════════════════════════════════════════════════════════════════════════

   Questo modulo fa quello che un gruppo di chemioinformatica fa ogni giorno:
   prende un insieme di molecole con un'attivita' misurata, lo ripulisce, lo
   descrive, lo raggruppa, e ci costruisce sopra un modello — dicendo poi, con
   onesta', se quel modello vale qualcosa.

   PERCHE' ESISTE
   L'applicazione aveva RDKit caricato e ne usava cinque funzioni: descrittori,
   un fingerprint, InChI, sottostruttura, disegno. La sezione «data science»
   era materiale didattico — i sei passi del metodo, le risorse, una lista di
   spunte — non uno strumento che lavora. Per chi valuta da un'azienda di
   settore la differenza e' tutta qui: un conto e' sapere cos'e' un QSAR, un
   altro e' averne costruito uno e saper dire perche' non ci si puo' fidare.

   LA COSA CHE CONTA PIU' DI TUTTE: IL MODELLO NULLO
   Un modello QSAR produce SEMPRE un numero. Con 2048 variabili e cento
   molecole si ottiene un R² lusinghiero anche su etichette mescolate a caso:
   e' il modello che impara il rumore. Per questo ogni modello qui addestrato
   viene confrontato con il suo stesso insieme a ETICHETTE RIMESCOLATE
   (y-scrambling), ripetuto piu' volte. Se il modello vero non batte il suo
   sosia casuale, il banco lo dice — e allora non e' un modello, e' un
   ricamo sui dati.

   E LA SECONDA: COME SI DIVIDE L'INSIEME
   Dividere a caso fra addestramento e prova gonfia i risultati, perche' in
   chimica le molecole vengono in serie: cambiano un sostituente alla volta.
   Metterne una in addestramento e la sua gemella in prova non misura la
   capacita' di prevedere, misura la capacita' di copiare. Qui la divisione
   predefinita e' per SCAFFOLD (Bemis-Murcko): tutte le molecole con lo
   stesso scheletro finiscono dalla stessa parte. Il numero che ne esce e'
   piu' basso, ed e' quello vero.

   COSA NON FA, DICHIARATO
   · Non prevede l'attivita' di una molecola contro un bersaglio arbitrario:
     serve un insieme di partenza misurato.
   · Non calcola QED: RDKit MinimalLib non lo espone (43 descrittori, quello
     non c'e'). Si sarebbe potuto riscriverlo; una riscrittura non verificata
     contro l'originale sarebbe stata un numero plausibile e non controllato.
   · Non genera conformeri 3D ne' fa docking: fuori dalla portata di
     MinimalLib.
   · La regressione logistica e' addestrata a discesa del gradiente, non con
     IRLS: su fingerprint sparsi converge bene, ma e' una scelta, e va detta.

   USO   window.BSIChem.*  — vedi §10 per l'elenco delle funzioni pubbliche
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* ═══ §0 · Accesso a RDKit ═══════════════════════════════════════════════
     RDKit e' un modulo WebAssembly caricato in modo asincrono. Chiedere
     `window.RDKit` prima che sia pronto restituisce `undefined`, e il codice
     che vi si appoggia fallisce in un punto lontano da dove sta l'errore.
     Qui si chiede una volta e si dichiara chiaramente se manca. */
  function rdkit() {
    /* Tre nomi, non uno: l'applicazione principale mette l'istanza in
       `__rdkit` (e' il suo caricatore `bsiLoadRDKit` a deciderlo), il
       laboratorio la espone come `RDKit`, e il modulo ufficiale usa
       `RDKitModule`. Guardarne uno solo faceva dire «RDKit si sta
       caricando» per sempre su una pagina dove RDKit era gia' pronto. */
    var R = globale.__rdkit || globale.RDKit || globale.RDKitModule;
    if (!R || typeof R.get_mol !== 'function') return null;
    return R;
  }
  function esigiRdkit() {
    var R = rdkit();
    if (!R) throw new Error('RDKit non e\' ancora caricato: chiamare bsiLoadRDKit() e attendere.');
    return R;
  }

  /* Ogni molecola creata da RDKit occupa memoria nel heap WebAssembly e va
     liberata a mano: il garbage collector di JavaScript non la vede. Su
     qualche migliaio di molecole, dimenticarsene esaurisce il heap e il
     modulo smette di rispondere senza dire perche'. */
  function conMol(R, smiles, fn) {
    var m = null;
    try {
      m = R.get_mol(smiles);
      if (!m || !m.is_valid()) return null;
      return fn(m);
    } catch (e) {
      return null;
    } finally {
      if (m && m.delete) { try { m.delete(); } catch (e) {} }
    }
  }

  /* ═══ §1 · Standardizzazione ═════════════════════════════════════════════

     Un insieme che arriva da un foglio di calcolo contiene sempre: sali,
     duplicati scritti in modo diverso, e righe che non sono molecole. Se non
     si ripulisce prima, il modello impara anche quelli.

     La deduplicazione avviene sullo SMILES CANONICO, non sulla stringa
     scritta: `OC(=O)C` e `CC(=O)O` sono la stessa molecola, e contarla due
     volte falsa sia il conteggio sia la divisione in addestramento e prova
     (la stessa molecola da entrambe le parti e' una fuga di informazione). */

  function frammentoMaggiore(R, smiles) {
    /* Un sale — `CC(=O)[O-].[Na+]` — ha un controione che non fa parte del
       farmaco e ne sposta il peso. Si tiene il frammento con piu' atomi
       pesanti. Si lavora sulla stringa perche' `get_frags()` di MinimalLib
       non espone una dimensione utilizzabile: verificato all'esecuzione. */
    if (smiles.indexOf('.') === -1) return smiles;
    var pezzi = smiles.split('.');
    var migliore = null, maxAtomi = -1;
    for (var i = 0; i < pezzi.length; i++) {
      var n = conMol(R, pezzi[i], function (m) { return m.get_num_atoms(); });
      if (n !== null && n > maxAtomi) { maxAtomi = n; migliore = pezzi[i]; }
    }
    return migliore || smiles;
  }

  function standardizza(righe, opzioni) {
    opzioni = opzioni || {};
    var R = esigiRdkit();
    var togliSali = opzioni.togliSali !== false;
    var accettate = [], scartate = [], visti = Object.create(null);

    for (var i = 0; i < righe.length; i++) {
      var r = righe[i];
      var smi = String(r.smiles || '').trim();
      if (!smi) { scartate.push({ riga: i + 1, smiles: smi, motivo: 'riga vuota' }); continue; }

      var pulito = togliSali ? frammentoMaggiore(R, smi) : smi;
      var canonico = conMol(R, pulito, function (m) { return m.get_smiles(); });
      if (!canonico) {
        scartate.push({ riga: i + 1, smiles: smi, motivo: 'SMILES non interpretabile da RDKit' });
        continue;
      }
      if (visti[canonico] !== undefined) {
        scartate.push({
          riga: i + 1, smiles: smi,
          motivo: 'duplicato della riga ' + (visti[canonico] + 1) + ' (stesso SMILES canonico)'
        });
        continue;
      }
      visti[canonico] = i;

      var voce = { smiles: canonico, originale: smi, nome: r.nome || ('mol-' + (accettate.length + 1)) };
      if (r.attivita !== undefined && r.attivita !== null && r.attivita !== '') {
        var y = Number(r.attivita);
        if (!isFinite(y)) {
          scartate.push({ riga: i + 1, smiles: smi, motivo: 'attivita\' non numerica: «' + r.attivita + '»' });
          continue;
        }
        voce.attivita = y;
      }
      accettate.push(voce);
    }
    return { molecole: accettate, scartate: scartate };
  }

  /* Lettore di testo incollato: TSV, CSV o SMILES puro, con o senza
     intestazione. Si indovina il separatore contando quale compare piu'
     spesso: un file con virgole nei nomi e tabulazioni fra le colonne non e'
     raro, e scegliere la virgola lo spezzerebbe nel posto sbagliato. */
  function leggiTesto(testo) {
    var righe = String(testo).split(/\r?\n/).filter(function (r) { return r.trim(); });
    if (!righe.length) return [];
    var sep = (righe[0].split('\t').length > righe[0].split(',').length) ? '\t'
            : (righe[0].split(',').length > 1 ? ',' : /\s+/);
    var campi = righe.map(function (r) {
      return (sep instanceof RegExp ? r.trim().split(sep) : r.split(sep)).map(function (c) { return c.trim(); });
    });
    var intestazione = campi[0].some(function (c) {
      return /^(smiles|smi|structure|nome|name|id|attivit|activity|pic50|ic50|ki|y|label)/i.test(c);
    });
    var iSmi = 0, iNome = -1, iAtt = -1;
    if (intestazione) {
      campi[0].forEach(function (c, k) {
        if (/^(smiles|smi|structure)$/i.test(c)) iSmi = k;
        else if (/^(nome|name|id|chembl)/i.test(c)) iNome = k;
        else if (/^(attivit|activity|pic50|pki|ic50|ki|y|label|target)/i.test(c)) iAtt = k;
      });
      campi.shift();
    } else if (campi[0].length >= 2) {
      /* senza intestazione: se l'ultima colonna e' numerica la si prende
         come attivita', altrimenti come nome */
      iAtt = isFinite(Number(campi[0][campi[0].length - 1])) ? campi[0].length - 1 : -1;
      if (iAtt === -1 && campi[0].length >= 2) iNome = 1;
    }
    return campi.map(function (c) {
      return {
        smiles: c[iSmi],
        nome: iNome >= 0 ? c[iNome] : undefined,
        attivita: iAtt >= 0 ? c[iAtt] : undefined
      };
    });
  }

  /* ═══ §2 · Descrittori e regole di drug-likeness ═════════════════════════

     Le regole sono soglie empiriche pubblicate, non leggi: una molecola che
     viola Lipinski puo' benissimo essere un farmaco (lo sono la ciclosporina
     e molti antibiotici). Servono a ordinare una libreria, non a scartare.
     Per questo qui si riporta QUANTE violazioni, non un verdetto. */

  var REGOLE = {
    lipinski: {
      nome: 'Lipinski (Ro5)',
      fonte: 'Lipinski et al., Adv Drug Deliv Rev 1997',
      prova: function (d) {
        return [
          { c: 'MW ≤ 500', ok: d.amw <= 500, v: d.amw },
          { c: 'cLogP ≤ 5', ok: d.CrippenClogP <= 5, v: d.CrippenClogP },
          { c: 'HBD ≤ 5', ok: d.lipinskiHBD <= 5, v: d.lipinskiHBD },
          { c: 'HBA ≤ 10', ok: d.lipinskiHBA <= 10, v: d.lipinskiHBA }
        ];
      }
    },
    veber: {
      nome: 'Veber',
      fonte: 'Veber et al., J Med Chem 2002',
      prova: function (d) {
        return [
          { c: 'legami rotabili ≤ 10', ok: d.NumRotatableBonds <= 10, v: d.NumRotatableBonds },
          { c: 'TPSA ≤ 140 Å²', ok: d.tpsa <= 140, v: d.tpsa }
        ];
      }
    },
    egan: {
      nome: 'Egan',
      fonte: 'Egan et al., J Med Chem 2000',
      prova: function (d) {
        return [
          { c: 'cLogP ≤ 5,88', ok: d.CrippenClogP <= 5.88, v: d.CrippenClogP },
          { c: 'TPSA ≤ 131,6 Å²', ok: d.tpsa <= 131.6, v: d.tpsa }
        ];
      }
    },
    ghose: {
      nome: 'Ghose',
      fonte: 'Ghose et al., J Comb Chem 1999',
      prova: function (d) {
        return [
          { c: '160 ≤ MW ≤ 480', ok: d.amw >= 160 && d.amw <= 480, v: d.amw },
          { c: '−0,4 ≤ cLogP ≤ 5,6', ok: d.CrippenClogP >= -0.4 && d.CrippenClogP <= 5.6, v: d.CrippenClogP },
          { c: '20 ≤ atomi ≤ 70', ok: d.NumHeavyAtoms >= 20 && d.NumHeavyAtoms <= 70, v: d.NumHeavyAtoms },
          { c: '40 ≤ MR ≤ 130', ok: d.CrippenMR >= 40 && d.CrippenMR <= 130, v: d.CrippenMR }
        ];
      }
    }
  };

  function descrittori(smiles) {
    var R = esigiRdkit();
    return conMol(R, smiles, function (m) {
      var d = JSON.parse(m.get_descriptors());
      var regole = {};
      Object.keys(REGOLE).forEach(function (k) {
        var criteri = REGOLE[k].prova(d);
        regole[k] = {
          nome: REGOLE[k].nome,
          fonte: REGOLE[k].fonte,
          criteri: criteri,
          violazioni: criteri.filter(function (c) { return !c.ok; }).length
        };
      });
      d.regole = regole;
      /* La frazione di carboni sp³ e il numero di stereocentri sono i due
         indicatori di «complessita' tridimensionale» che la letteratura lega
         al successo clinico (Lovering et al., J Med Chem 2009). Li si mette
         in evidenza perche' altrimenti restano sepolti fra i 43. */
      d.complessita = {
        fsp3: d.FractionCSP3,
        stereocentri: d.NumAtomStereoCenters,
        stereocentriNonSpecificati: d.NumUnspecifiedAtomStereoCenters,
        anelliAromatici: d.NumAromaticRings
      };
      return d;
    });
  }

  /* ═══ §3 · Fingerprint e similarita' ═════════════════════════════════════

     MinimalLib restituisce i fingerprint come STRINGA di caratteri '0' e '1'.
     Lavorarci sopra con operazioni su stringhe e' lento e sbagliato: per
     centomila confronti servono operazioni su interi. Qui si converte una
     volta sola in Uint32Array e si contano i bit con l'algoritmo di Wegner
     (popcount), che costa quanto il numero di bit ACCESI, non 32 per parola —
     e un fingerprint molecolare e' sparso: tipicamente 40-60 bit su 2048. */

  var TIPI_FP = {
    morgan: { nome: 'Morgan / ECFP', predefinito: { radius: 2, nBits: 2048 } },
    rdkit:  { nome: 'RDKit (percorsi)', predefinito: { nBits: 2048 } },
    pattern:{ nome: 'Pattern', predefinito: { nBits: 2048 } },
    maccs:  { nome: 'MACCS (166 chiavi)', predefinito: {} },
    atompair: { nome: 'Coppie di atomi', predefinito: { nBits: 2048 } },
    torsion:  { nome: 'Torsioni topologiche', predefinito: { nBits: 2048 } }
  };

  function bitDaStringa(s) {
    var n = s.length, parole = new Uint32Array((n + 31) >> 5), acc = 0;
    for (var i = 0; i < n; i++) {
      if (s.charCodeAt(i) === 49) { parole[i >> 5] |= (1 << (i & 31)); acc++; }
    }
    return { parole: parole, nBits: n, accesi: acc };
  }

  function fingerprint(smiles, tipo, opzioni) {
    var R = esigiRdkit();
    tipo = tipo || 'morgan';
    var cfg = JSON.stringify(Object.assign({}, TIPI_FP[tipo] ? TIPI_FP[tipo].predefinito : {}, opzioni || {}));
    return conMol(R, smiles, function (m) {
      var s;
      switch (tipo) {
        case 'morgan':   s = m.get_morgan_fp(cfg); break;
        case 'rdkit':    s = m.get_rdkit_fp(cfg); break;
        case 'pattern':  s = m.get_pattern_fp(cfg); break;
        case 'maccs':    s = m.get_maccs_fp(); break;
        case 'atompair': s = m.get_atom_pair_fp(cfg); break;
        case 'torsion':  s = m.get_topological_torsion_fp(cfg); break;
        default: throw new Error('tipo di fingerprint sconosciuto: ' + tipo);
      }
      return bitDaStringa(s);
    });
  }

  function popcount(x) {
    /* Wegner: ogni giro spegne il bit acceso piu' basso. */
    var n = 0;
    while (x) { x &= (x - 1); n++; }
    return n;
  }

  function comuni(a, b) {
    var n = Math.min(a.parole.length, b.parole.length), c = 0;
    for (var i = 0; i < n; i++) c += popcount(a.parole[i] & b.parole[i]);
    return c;
  }

  /* Tanimoto: |A∩B| / |A∪B| = c / (a + b − c).
     Due fingerprint entrambi vuoti hanno unione zero: la definizione
     matematica darebbe 0/0. Si restituisce 1, perche' sono identici — ed e'
     la convenzione di RDKit. Lasciare NaN avvelenerebbe in silenzio ogni
     media e ogni ordinamento a valle. */
  function tanimoto(a, b) {
    var c = comuni(a, b), u = a.accesi + b.accesi - c;
    return u === 0 ? 1 : c / u;
  }
  function dice(a, b) {
    var c = comuni(a, b), s = a.accesi + b.accesi;
    return s === 0 ? 1 : (2 * c) / s;
  }

  function matriceSimilarita(fps, metrica) {
    var f = metrica === 'dice' ? dice : tanimoto;
    var n = fps.length, M = [];
    for (var i = 0; i < n; i++) {
      M.push(new Float64Array(n));
      M[i][i] = 1;
    }
    for (i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var s = f(fps[i], fps[j]);
        M[i][j] = s; M[j][i] = s;
      }
    }
    return M;
  }

  function viciniPiuSimili(fpQuery, fps, k, metrica) {
    var f = metrica === 'dice' ? dice : tanimoto;
    var out = [];
    for (var i = 0; i < fps.length; i++) out.push({ i: i, s: f(fpQuery, fps[i]) });
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, k || 10);
  }

  /* ═══ §4 · Raggruppamento e selezione per diversita' ═════════════════════ */

  /* Butina (J Chem Inf Comput Sci 1999): l'algoritmo standard in
     chemioinformatica. Si ordinano le molecole per numero di vicini entro
     soglia, in ordine decrescente; la prima diventa centroide e si porta via
     tutti i suoi vicini ancora liberi; si ripete. E' deterministico e non
     richiede di sapere in anticipo quanti gruppi ci sono — che e' il motivo
     per cui si preferisce a k-means su questi dati. */
  function butina(fps, soglia, metrica) {
    soglia = (soglia === undefined) ? 0.65 : soglia;
    var n = fps.length, M = matriceSimilarita(fps, metrica);
    var vicini = [];
    for (var i = 0; i < n; i++) {
      var v = [];
      for (var j = 0; j < n; j++) if (j !== i && M[i][j] >= soglia) v.push(j);
      vicini.push(v);
    }
    var ordine = [];
    for (i = 0; i < n; i++) ordine.push(i);
    ordine.sort(function (a, b) {
      return vicini[b].length - vicini[a].length || a - b;   // stabile: a parita', indice
    });
    var assegnato = new Int32Array(n).fill(-1), gruppi = [];
    for (var k = 0; k < ordine.length; k++) {
      var c = ordine[k];
      if (assegnato[c] !== -1) continue;
      var g = [c];
      assegnato[c] = gruppi.length;
      for (var q = 0; q < vicini[c].length; q++) {
        var w = vicini[c][q];
        if (assegnato[w] === -1) { assegnato[w] = gruppi.length; g.push(w); }
      }
      gruppi.push({ centroide: c, membri: g });
    }
    return {
      soglia: soglia,
      gruppi: gruppi,
      assegnazione: Array.prototype.slice.call(assegnato),
      singoletti: gruppi.filter(function (g) { return g.membri.length === 1; }).length
    };
  }

  /* MaxMin: si sceglie ogni volta la molecola piu' LONTANA da tutto quello
     che si e' gia' preso. E' il modo standard di estrarre un sottoinsieme
     rappresentativo da una libreria grande quando si ha budget per provarne
     poche. Il primo elemento va scelto in modo riproducibile, non a caso,
     altrimenti due esecuzioni sugli stessi dati danno insiemi diversi e il
     risultato non e' difendibile: qui si parte dall'indice 0. */
  function maxmin(fps, quante, metrica) {
    var n = fps.length;
    quante = Math.min(quante || 10, n);
    if (!n) return [];
    var f = metrica === 'dice' ? dice : tanimoto;
    var scelti = [0];
    var minDist = new Float64Array(n);
    for (var i = 0; i < n; i++) minDist[i] = 1 - f(fps[0], fps[i]);
    while (scelti.length < quante) {
      var best = -1, bestD = -1;
      for (i = 0; i < n; i++) {
        if (minDist[i] > bestD && scelti.indexOf(i) === -1) { bestD = minDist[i]; best = i; }
      }
      if (best === -1) break;
      scelti.push(best);
      for (i = 0; i < n; i++) {
        var d = 1 - f(fps[best], fps[i]);
        if (d < minDist[i]) minDist[i] = d;
      }
    }
    return scelti;
  }

  /* ═══ §5 · Scaffold di Bemis-Murcko ══════════════════════════════════════

     Lo scheletro di una molecola: si tolgono i sostituenti e restano gli
     anelli piu' le catene che li collegano. MinimalLib non espone
     MurckoScaffold, ma espone il GRAFO (`get_json`), e l'algoritmo e' la sua
     definizione: si eliminano a ripetizione gli atomi terminali che non
     stanno in un anello, finche' non ne restano.

     Serve per la DIVISIONE PER SCAFFOLD (§8) — la ragione vera per cui e'
     qui — e per vedere di quante serie chimiche e' fatto un insieme. */
  function scaffoldMurcko(smiles) {
    var R = esigiRdkit();
    return conMol(R, smiles, function (m) {
      var j = JSON.parse(m.get_json());
      var mol = j.molecules && j.molecules[0];
      if (!mol) return null;
      var nA = mol.atoms.length;
      var adiacenza = [];
      for (var i = 0; i < nA; i++) adiacenza.push([]);
      mol.bonds.forEach(function (b) {
        adiacenza[b.atoms[0]].push(b.atoms[1]);
        adiacenza[b.atoms[1]].push(b.atoms[0]);
      });

      /* Quali atomi stanno in un anello: un atomo e' in un anello se
         rimuoverlo NON aumenta il numero di componenti connesse... troppo
         costoso. Si usa invece la sfoltitura: si tolgono iterativamente i
         nodi di grado 1; quello che resta e' l'insieme dei cicli piu' i
         percorsi fra cicli. Ed e' esattamente lo scaffold. */
      var grado = adiacenza.map(function (a) { return a.length; });
      var vivo = new Uint8Array(nA).fill(1);
      var cambiato = true;
      while (cambiato) {
        cambiato = false;
        for (i = 0; i < nA; i++) {
          if (vivo[i] && grado[i] <= 1) {
            vivo[i] = 0; cambiato = true;
            adiacenza[i].forEach(function (v) { if (vivo[v]) grado[v]--; });
          }
        }
      }
      var tenuti = [];
      for (i = 0; i < nA; i++) if (vivo[i]) tenuti.push(i);

      /* Una molecola aciclica non ha scaffold: dirlo e' corretto, inventarne
         uno no. Si restituisce la stringa vuota, e chi divide per scaffold
         le tratta come un gruppo a se'. */
      if (!tenuti.length) return { chiave: '', smiles: '', eUnoSmiles: false, aciclica: true, atomi: 0 };

      /* Si riscrive lo scaffold come SMILES passando per la sottostruttura:
         si costruisce il molblock dei soli atomi tenuti. Piu' semplice e
         robusto: si chiede a RDKit lo SMILES della molecola con gli atomi
         non tenuti marcati come da rimuovere, usando l'ordine canonico. */
      var setTenuti = Object.create(null);
      tenuti.forEach(function (a) { setTenuti[a] = 1; });
      var pezzi = [];
      mol.bonds.forEach(function (b) {
        if (setTenuti[b.atoms[0]] && setTenuti[b.atoms[1]]) pezzi.push(b);
      });
      /* ATTENZIONE AL NOME. `chiave` NON e' uno SMILES: e' un'impronta
         canonica dello scheletro, costruita perche' due molecole con lo
         stesso scheletro producano la stessa stringa. Serve a RAGGRUPPARE
         (pieghe, divisione per scaffold), non a interrogare.

         Il campo si chiamava `smiles` e il pannello SAR lo ha usato come
         query: proponeva «6,6,6,6,7,...|0-13:1,...» come nucleo e la
         decomposizione rispondeva «nucleo non interpretabile». Il nome
         sbagliato di un campo e' un difetto come un altro, e questo l'ha
         prodotto. `smiles` resta come alias per non rompere il codice che lo
         legge, ma il nome giusto e' `chiave`. */
      var k = scaffoldSmiles(R, smiles, tenuti);
      return {
        chiave: k,
        smiles: k,
        eUnoSmiles: false,
        aciclica: false,
        atomi: tenuti.length,
        legami: pezzi.length
      };
    });
  }

  /* Ricostruisce lo SMILES dello scaffold. Si passa per un SMARTS costruito
     sugli atomi tenuti e si chiede a RDKit di canonizzare: e' l'unico modo,
     senza RWMol, di ottenere una stringa confrontabile fra molecole diverse.
     La chiave della divisione per scaffold non e' la bellezza della stringa,
     e' che due molecole con lo stesso scheletro producano la STESSA chiave. */
  function scaffoldSmiles(R, smiles, tenuti) {
    var m = null;
    try {
      m = R.get_mol(smiles);
      var j = JSON.parse(m.get_json());
      var mol = j.molecules[0];
      var set = Object.create(null);
      tenuti.forEach(function (a) { set[a] = 1; });
      /* chiave canonica: elementi degli atomi tenuti in ordine, piu' i
         legami fra loro, entrambi ordinati. Non e' uno SMILES, ed e' bene
         dirlo: e' un'IMPRONTA dello scaffold, stabile e confrontabile. */
      var el = tenuti.map(function (a) {
        return (mol.atoms[a].chg ? '[' + (mol.atoms[a].z || 6) + ']' : '') + (mol.atoms[a].z || 6);
      });
      var rimappa = Object.create(null);
      tenuti.forEach(function (a, k) { rimappa[a] = k; });
      var lg = [];
      mol.bonds.forEach(function (b) {
        if (set[b.atoms[0]] && set[b.atoms[1]]) {
          var x = rimappa[b.atoms[0]], y = rimappa[b.atoms[1]];
          lg.push((x < y ? x + '-' + y : y + '-' + x) + ':' + (b.bo || 1));
        }
      });
      lg.sort();
      return el.join(',') + '|' + lg.join(',');
    } catch (e) {
      return '';
    } finally {
      if (m && m.delete) { try { m.delete(); } catch (e) {} }
    }
  }

  /* ═══ §6 · Allarmi strutturali ═══════════════════════════════════════════

     Sottostrutture che in uno screening danno quasi sempre falsi positivi
     (PAINS) o che un chimico medicinale non vuole in un capofila (Brenk).
     L'elenco qui e' un SOTTOINSIEME dei piu' frequenti, non il catalogo
     completo: dichiararlo e' parte della misura. Un allarme non e' un
     verdetto — e' un invito a guardare. */
  var ALLARMI = [
    { id: 'chinone', smarts: 'O=C1C=CC(=O)C=C1', classe: 'PAINS', perche: 'redox-attivo: interferisce con molti saggi' },
    { id: 'catecolo', smarts: 'c1cc(O)c(O)cc1', classe: 'PAINS', perche: 'chelante e redox-attivo' },
    { id: 'michael', smarts: '[CX3]=[CX3][CX3]=[OX1]', classe: 'Brenk', perche: 'accettore di Michael: reattivo verso tioli' },
    { id: 'nitro-aromatico', smarts: '[$([NX3](=O)=O),$([NX3+](=O)[O-])][c]', classe: 'Brenk', perche: 'potenziale mutagenicita\'' },
    { id: 'azo', smarts: '[#6]N=N[#6]', classe: 'Brenk', perche: 'si scinde in ammine aromatiche' },
    { id: 'aldeide', smarts: '[CX3H1](=O)[#6]', classe: 'Brenk', perche: 'elettrofilo reattivo' },
    { id: 'alogenuro-alchilico', smarts: '[CX4][Cl,Br,I]', classe: 'Brenk', perche: 'agente alchilante' },
    { id: 'isocianato', smarts: 'N=C=O', classe: 'Brenk', perche: 'altamente reattivo' },
    { id: 'perossido', smarts: '[OX2][OX2]', classe: 'Brenk', perche: 'instabile, potenzialmente esplosivo' },
    { id: 'tiolo-libero', smarts: '[SX2H]', classe: 'Brenk', perche: 'si ossida e forma disolfuri' },
    { id: 'anidride', smarts: '[CX3](=O)[OX2][CX3](=O)', classe: 'Brenk', perche: 'idrolizza rapidamente' },
    { id: 'epossido', smarts: 'C1OC1', classe: 'Brenk', perche: 'agente alchilante' },
    { id: 'fosfato', smarts: 'P(=O)(O)(O)', classe: 'Brenk', perche: 'permeabilita\' cellulare scarsa' },
    { id: 'idrazina', smarts: '[NX3][NX3]', classe: 'Brenk', perche: 'tossicita\' epatica' },
    { id: 'rodanina', smarts: 'C1SC(=S)NC1=O', classe: 'PAINS', perche: 'promiscuo: attivo in molti saggi scorrelati' },
    { id: 'fenol-sulfonammide', smarts: 'c1cc(O)ccc1S(=O)(=O)N', classe: 'PAINS', perche: 'frequente falso positivo' }
  ];

  var _qmolCache = Object.create(null);
  function allarmi(smiles) {
    var R = esigiRdkit();
    var trovati = [];
    var m = null;
    try {
      m = R.get_mol(smiles);
      if (!m || !m.is_valid()) return null;
      for (var i = 0; i < ALLARMI.length; i++) {
        var a = ALLARMI[i];
        try {
          if (!_qmolCache[a.smarts]) _qmolCache[a.smarts] = R.get_qmol(a.smarts);
          var mm = JSON.parse(m.get_substruct_matches(_qmolCache[a.smarts]));
          if (mm && mm.length) {
            trovati.push({ id: a.id, classe: a.classe, perche: a.perche, occorrenze: mm.length, atomi: mm[0].atoms });
          }
        } catch (e) { /* uno SMARTS che RDKit rifiuta non deve fermare gli altri */ }
      }
      return { allarmi: trovati, esaminati: ALLARMI.length };
    } finally {
      if (m && m.delete) { try { m.delete(); } catch (e) {} }
    }
  }

  /* ═══ §7 · Algebra lineare minima ════════════════════════════════════════
     Serve per la PCA e per la regressione ridge. Scritta qui e non presa da
     una libreria perche' l'applicazione non carica codice da CDN, e perche'
     tre routine servono e tremila no. */

  /* Jacobi ciclico per matrici simmetriche. Converge sempre, e a differenza
     del metodo delle potenze restituisce TUTTI gli autovalori: servono per
     dire quanta varianza spiega ciascuna componente — senza quel numero un
     grafico PCA non si puo' interpretare. */
  function jacobi(Ain, maxIter) {
    var n = Ain.length, A = Ain.map(function (r) { return Float64Array.from(r); });
    var V = [];
    for (var i = 0; i < n; i++) { V.push(new Float64Array(n)); V[i][i] = 1; }
    maxIter = maxIter || 100;
    for (var iter = 0; iter < maxIter; iter++) {
      var off = 0;
      for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-20) break;
      for (var p = 0; p < n - 1; p++) {
        for (var q = p + 1; q < n; q++) {
          if (Math.abs(A[p][q]) < 1e-18) continue;
          var theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
          var t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          var c = 1 / Math.sqrt(t * t + 1), s = t * c;
          for (var k = 0; k < n; k++) {
            var akp = A[k][p], akq = A[k][q];
            A[k][p] = c * akp - s * akq;
            A[k][q] = s * akp + c * akq;
          }
          for (k = 0; k < n; k++) {
            var apk = A[p][k], aqk = A[q][k];
            A[p][k] = c * apk - s * aqk;
            A[q][k] = s * apk + c * aqk;
          }
          for (k = 0; k < n; k++) {
            var vkp = V[k][p], vkq = V[k][q];
            V[k][p] = c * vkp - s * vkq;
            V[k][q] = s * vkp + c * vkq;
          }
        }
      }
    }
    var autoval = [];
    for (i = 0; i < n; i++) autoval.push({ val: A[i][i], vec: V.map(function (r) { return r[i]; }) });
    autoval.sort(function (a, b) { return b.val - a.val; });
    return autoval;
  }

  /* Risolve (K + λI) x = y con eliminazione di Gauss e pivot parziale.
     Il pivot non e' un vezzo: senza, su matrici mal condizionate — e una
     matrice di Gram di fingerprint lo e' — si divide per un numero vicino a
     zero e il risultato esce senza senso ma senza errori. */
  function risolvi(K, y, lambda) {
    var n = y.length;
    var A = [];
    for (var i = 0; i < n; i++) {
      var r = new Float64Array(n + 1);
      for (var j = 0; j < n; j++) r[j] = K[i][j];
      r[i] += lambda;
      r[n] = y[i];
      A.push(r);
    }
    for (var col = 0; col < n; col++) {
      var piv = col;
      for (i = col + 1; i < n; i++) if (Math.abs(A[i][col]) > Math.abs(A[piv][col])) piv = i;
      if (Math.abs(A[piv][col]) < 1e-12) continue;
      var tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
      for (i = col + 1; i < n; i++) {
        var f = A[i][col] / A[col][col];
        if (!f) continue;
        for (j = col; j <= n; j++) A[i][j] -= f * A[col][j];
      }
    }
    var x = new Float64Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = A[i][n];
      for (j = i + 1; j < n; j++) s -= A[i][j] * x[j];
      x[i] = Math.abs(A[i][i]) < 1e-12 ? 0 : s / A[i][i];
    }
    return x;
  }

  /* ═══ §8 · PCA sullo spazio chimico ══════════════════════════════════════

     Con 2048 bit e cento molecole la matrice di covarianza e' 2048×2048:
     diagonalizzarla e' inutile oltre che lento, perche' ha al massimo n−1
     autovalori non nulli. Si usa il TRUCCO DI GRAM: si diagonalizza XXᵀ, che
     e' n×n, e si ricavano le componenti da li'. Stesso risultato, mille
     volte piu' veloce. */
  function pca(fps, componenti) {
    componenti = componenti || 2;
    var n = fps.length;
    if (n < 2) return { punti: [], varianzaSpiegata: [] };
    var p = fps[0].nBits;

    var X = [];
    for (var i = 0; i < n; i++) {
      var riga = new Float64Array(p);
      for (var b = 0; b < p; b++) riga[b] = (fps[i].parole[b >> 5] >>> (b & 31)) & 1;
      X.push(riga);
    }
    var media = new Float64Array(p);
    for (i = 0; i < n; i++) for (b = 0; b < p; b++) media[b] += X[i][b];
    for (b = 0; b < p; b++) media[b] /= n;
    for (i = 0; i < n; i++) for (b = 0; b < p; b++) X[i][b] -= media[b];

    var G = [];
    for (i = 0; i < n; i++) {
      G.push(new Float64Array(n));
      for (var j = 0; j <= i; j++) {
        var s = 0;
        for (b = 0; b < p; b++) s += X[i][b] * X[j][b];
        G[i][j] = s;
        if (j < i) G[j][i] = s;
      }
    }
    var eig = jacobi(G.map(function (r) { return Array.prototype.slice.call(r); }));
    var totale = eig.reduce(function (a, e) { return a + Math.max(0, e.val); }, 0);
    var punti = [];
    for (i = 0; i < n; i++) {
      var c = [];
      for (var k = 0; k < componenti; k++) {
        var lam = Math.max(eig[k].val, 0);
        c.push(eig[k].vec[i] * Math.sqrt(lam));
      }
      punti.push(c);
    }
    return {
      punti: punti,
      varianzaSpiegata: eig.slice(0, componenti).map(function (e) {
        return totale > 0 ? Math.max(0, e.val) / totale : 0;
      })
    };
  }

  /* ═══ §9 · Modelli e — soprattutto — la loro validazione ═════════════════ */

  /* Divisione per scaffold. Si raggruppa per scheletro, si ordinano i gruppi
     dal piu' numeroso al piu' piccolo e si riempie l'addestramento finche'
     non e' pieno: cosi' i gruppi grandi (le serie congeneriche) stanno tutti
     da una parte e la prova contiene chimica che il modello non ha visto.
     E' la divisione che Bemis e Murcko avevano in mente, ed e' quella che
     produce i numeri piu' bassi e piu' onesti. */
  function divisionePerScaffold(molecole, frazioneProva) {
    frazioneProva = frazioneProva || 0.25;
    var gruppi = Object.create(null);
    molecole.forEach(function (m, i) {
      var s = m._scaffold !== undefined ? m._scaffold : (scaffoldMurcko(m.smiles) || {}).smiles;
      m._scaffold = s;
      var chiave = s || ('aciclica#' + i);      // ogni aciclica e' un gruppo a se'
      (gruppi[chiave] = gruppi[chiave] || []).push(i);
    });
    var elenco = Object.keys(gruppi).map(function (k) { return gruppi[k]; });
    elenco.sort(function (a, b) { return b.length - a.length; });
    var nProva = Math.max(1, Math.round(molecole.length * frazioneProva));
    var prova = [], addestramento = [];
    elenco.forEach(function (g) {
      if (prova.length + g.length <= nProva) prova = prova.concat(g);
      else addestramento = addestramento.concat(g);
    });
    /* Se il gruppo piu' grande e' enorme puo' capitare che la prova resti
       vuota: allora si prende il gruppo piu' piccolo. Un insieme di prova
       vuoto darebbe metriche NaN, che e' il modo peggiore di fallire. */
    if (!prova.length && elenco.length > 1) {
      var ultimo = elenco[elenco.length - 1];
      prova = ultimo;
      addestramento = addestramento.filter(function (i) { return ultimo.indexOf(i) === -1; });
    }
    return { addestramento: addestramento, prova: prova, nGruppi: elenco.length };
  }

  /* Generatore pseudo-casuale riproducibile (mulberry32). Serve perche' le
     divisioni casuali e lo y-scrambling devono potersi RIPETERE: un
     risultato che cambia a ogni esecuzione non e' verificabile da nessuno. */
  function rng(seme) {
    var a = seme >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function divisioneCasuale(n, frazioneProva, seme) {
    var r = rng(seme || 42), idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    for (i = n - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    var nProva = Math.max(1, Math.round(n * (frazioneProva || 0.25)));
    return { prova: idx.slice(0, nProva), addestramento: idx.slice(nProva) };
  }

  /* Ridge in forma duale: w = Xᵀ(XXᵀ + λI)⁻¹y, e la previsione su un nuovo
     punto e' k(x)ᵀα. Con p ≫ n — 2048 bit contro cento molecole — il sistema
     da risolvere e' n×n invece di p×p. Non e' un'ottimizzazione: e' cio' che
     rende il calcolo possibile nel browser. */
  function addestraRidge(fpsTrain, yTrain, lambda) {
    var n = fpsTrain.length;
    var K = [];
    for (var i = 0; i < n; i++) {
      K.push(new Float64Array(n));
      for (var j = 0; j <= i; j++) {
        var s = comuni(fpsTrain[i], fpsTrain[j]);   // prodotto scalare di bit
        K[i][j] = s; if (j < i) K[j][i] = s;
      }
    }
    var mediaY = yTrain.reduce(function (a, b) { return a + b; }, 0) / n;
    var yc = yTrain.map(function (v) { return v - mediaY; });
    var alpha = risolvi(K, yc, lambda === undefined ? 1 : lambda);
    return {
      tipo: 'ridge', alpha: alpha, fps: fpsTrain, mediaY: mediaY,
      lambda: lambda === undefined ? 1 : lambda
    };
  }
  function prediciRidge(modello, fp) {
    var s = 0;
    for (var i = 0; i < modello.fps.length; i++) s += modello.alpha[i] * comuni(modello.fps[i], fp);
    return s + modello.mediaY;
  }

  /* Regressione logistica L2, discesa del gradiente su feature sparse.
     Il gradiente tocca solo i bit accesi (≈50 su 2048): un passo costa
     quanto la sparsita', non quanto la dimensione. */
  function addestraLogistica(fpsTrain, yTrain, opzioni) {
    opzioni = opzioni || {};
    var p = fpsTrain[0].nBits, n = fpsTrain.length;
    var passi = opzioni.passi || 400, eta = opzioni.eta || 0.5, lambda = opzioni.lambda === undefined ? 0.01 : opzioni.lambda;
    var w = new Float64Array(p), b = 0;
    var bitDi = fpsTrain.map(function (f) {
      var v = [];
      for (var k = 0; k < f.nBits; k++) if ((f.parole[k >> 5] >>> (k & 31)) & 1) v.push(k);
      return v;
    });
    for (var it = 0; it < passi; it++) {
      var gb = 0, gw = Object.create(null);
      for (var i = 0; i < n; i++) {
        var z = b, bits = bitDi[i];
        for (var k = 0; k < bits.length; k++) z += w[bits[k]];
        var pr = 1 / (1 + Math.exp(-z));
        var err = pr - yTrain[i];
        gb += err;
        for (k = 0; k < bits.length; k++) gw[bits[k]] = (gw[bits[k]] || 0) + err;
      }
      b -= eta * gb / n;
      Object.keys(gw).forEach(function (k) {
        var idx = +k;
        w[idx] -= eta * (gw[k] / n + lambda * w[idx]);
      });
    }
    return { tipo: 'logistica', w: w, b: b, lambda: lambda, passi: passi };
  }
  function prediciLogistica(modello, fp) {
    var z = modello.b;
    for (var k = 0; k < fp.nBits; k++) if ((fp.parole[k >> 5] >>> (k & 31)) & 1) z += modello.w[k];
    return 1 / (1 + Math.exp(-z));
  }

  /* ═══ Metriche ═══════════════════════════════════════════════════════════ */

  function metricheRegressione(yVero, yPrev) {
    var n = yVero.length;
    var media = yVero.reduce(function (a, b) { return a + b; }, 0) / n;
    var ssTot = 0, ssRes = 0, absSum = 0;
    for (var i = 0; i < n; i++) {
      ssTot += Math.pow(yVero[i] - media, 2);
      ssRes += Math.pow(yVero[i] - yPrev[i], 2);
      absSum += Math.abs(yVero[i] - yPrev[i]);
    }
    return {
      n: n,
      r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
      rmse: Math.sqrt(ssRes / n),
      mae: absSum / n,
      pearson: pearson(yVero, yPrev)
    };
  }
  function pearson(a, b) {
    var n = a.length, ma = 0, mb = 0;
    for (var i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    var num = 0, da = 0, db = 0;
    for (i = 0; i < n; i++) {
      num += (a[i] - ma) * (b[i] - mb);
      da += Math.pow(a[i] - ma, 2);
      db += Math.pow(b[i] - mb, 2);
    }
    return (da === 0 || db === 0) ? 0 : num / Math.sqrt(da * db);
  }

  /* ROC-AUC calcolata come statistica di Mann-Whitney: la probabilita' che
     un positivo preso a caso abbia punteggio piu' alto di un negativo preso
     a caso. Si usano i RANGHI, con i pari-merito mediati — senza quella
     accortezza un modello che dà lo stesso punteggio a tutti otterrebbe
     AUC 1 invece di 0,5. */
  function rocAuc(etichette, punteggi) {
    var n = etichette.length;
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    idx.sort(function (a, b) { return punteggi[a] - punteggi[b]; });
    var rango = new Float64Array(n), k = 0;
    while (k < n) {
      var j = k;
      while (j + 1 < n && punteggi[idx[j + 1]] === punteggi[idx[k]]) j++;
      var medio = (k + j) / 2 + 1;
      for (var q = k; q <= j; q++) rango[idx[q]] = medio;
      k = j + 1;
    }
    var nPos = 0, sommaRanghiPos = 0;
    for (i = 0; i < n; i++) if (etichette[i] === 1) { nPos++; sommaRanghiPos += rango[i]; }
    var nNeg = n - nPos;
    if (!nPos || !nNeg) return null;      // AUC non definita: si dice, non si inventa
    return (sommaRanghiPos - nPos * (nPos + 1) / 2) / (nPos * nNeg);
  }

  function metricheClassificazione(etichette, punteggi, soglia) {
    soglia = soglia === undefined ? 0.5 : soglia;
    var tp = 0, tn = 0, fp = 0, fn = 0;
    for (var i = 0; i < etichette.length; i++) {
      var p = punteggi[i] >= soglia ? 1 : 0;
      if (etichette[i] === 1 && p === 1) tp++;
      else if (etichette[i] === 0 && p === 0) tn++;
      else if (etichette[i] === 0 && p === 1) fp++;
      else fn++;
    }
    var den = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
    return {
      n: etichette.length, tp: tp, tn: tn, fp: fp, fn: fn,
      accuratezza: (tp + tn) / etichette.length,
      sensibilita: (tp + fn) ? tp / (tp + fn) : null,
      specificita: (tn + fp) ? tn / (tn + fp) : null,
      /* L'accuratezza bilanciata conta perche' un insieme sbilanciato
         90/10 premia con 0,90 un modello che dice sempre «no». */
      accuratezzaBilanciata: ((tp + fn) && (tn + fp)) ? ((tp / (tp + fn)) + (tn / (tn + fp))) / 2 : null,
      mcc: den === 0 ? 0 : (tp * tn - fp * fn) / den,
      auc: rocAuc(etichette, punteggi)
    };
  }

  /* ═══ Il modello, con il suo controllo nullo ═════════════════════════════ */

  function costruisciModello(molecole, opzioni) {
    opzioni = opzioni || {};
    var tipoFp = opzioni.fingerprint || 'morgan';
    var divisione = opzioni.divisione || 'scaffold';
    var frazione = opzioni.frazioneProva || 0.25;
    var nScramble = opzioni.scramble === undefined ? 10 : opzioni.scramble;
    var seme = opzioni.seme || 42;

    var conY = molecole.filter(function (m) { return typeof m.attivita === 'number'; });
    if (conY.length < 10) {
      throw new Error('servono almeno 10 molecole con attivita\' misurata: ne sono arrivate ' + conY.length);
    }

    var fps = conY.map(function (m) { return fingerprint(m.smiles, tipoFp); });
    var validi = [];
    fps.forEach(function (f, i) { if (f) validi.push(i); });
    fps = validi.map(function (i) { return fps[i]; });
    var mols = validi.map(function (i) { return conY[i]; });
    var y = mols.map(function (m) { return m.attivita; });

    /* Classificazione o regressione? Si guarda il dato, non si chiede: se
       ci sono due soli valori distinti ed entrambi in {0,1} e' una
       classificazione. */
    var distinti = Array.from(new Set(y));
    var classificazione = opzioni.classificazione !== undefined
      ? opzioni.classificazione
      : (distinti.length === 2 && distinti.every(function (v) { return v === 0 || v === 1; }));

    var div = divisione === 'scaffold'
      ? divisionePerScaffold(mols, frazione)
      : divisioneCasuale(mols.length, frazione, seme);

    function valuta(yUsata) {
      var fpTr = div.addestramento.map(function (i) { return fps[i]; });
      var yTr = div.addestramento.map(function (i) { return yUsata[i]; });
      var fpTe = div.prova.map(function (i) { return fps[i]; });
      var yTe = div.prova.map(function (i) { return yUsata[i]; });
      if (!fpTr.length || !fpTe.length) return null;
      if (classificazione) {
        var mod = addestraLogistica(fpTr, yTr, opzioni);
        var pr = fpTe.map(function (f) { return prediciLogistica(mod, f); });
        return { metriche: metricheClassificazione(yTe, pr), modello: mod, previsti: pr, veri: yTe };
      }
      var mr = addestraRidge(fpTr, yTr, opzioni.lambda);
      var pv = fpTe.map(function (f) { return prediciRidge(mr, f); });
      return { metriche: metricheRegressione(yTe, pv), modello: mr, previsti: pv, veri: yTe };
    }

    var vero = valuta(y);
    if (!vero) throw new Error('divisione degenere: addestramento o prova vuoti');

    /* ── Il controllo nullo ──────────────────────────────────────────────
       Si rimescolano le etichette e si riaddestra, piu' volte. Se il
       modello vero non stacca nettamente la nuvola dei sosia casuali, non
       ha imparato la chimica: ha imparato il rumore. */
    var sosia = [];
    var r = rng(seme + 1000);
    for (var s = 0; s < nScramble; s++) {
      var ys = y.slice();
      for (var i = ys.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1));
        var t = ys[i]; ys[i] = ys[j]; ys[j] = t;
      }
      var v = valuta(ys);
      if (v) sosia.push(classificazione ? (v.metriche.auc === null ? 0.5 : v.metriche.auc) : v.metriche.r2);
    }
    var mediaSosia = sosia.length ? sosia.reduce(function (a, b) { return a + b; }, 0) / sosia.length : null;
    var maxSosia = sosia.length ? Math.max.apply(null, sosia) : null;
    var punteggioVero = classificazione
      ? (vero.metriche.auc === null ? 0.5 : vero.metriche.auc)
      : vero.metriche.r2;

    return {
      tipo: classificazione ? 'classificazione' : 'regressione',
      fingerprint: tipoFp,
      divisione: divisione,
      nTotali: mols.length,
      nAddestramento: div.addestramento.length,
      nProva: div.prova.length,
      nScaffold: div.nGruppi,
      metriche: vero.metriche,
      previsti: vero.previsti,
      veri: vero.veri,
      modello: vero.modello,
      controlloNullo: {
        ripetizioni: sosia.length,
        punteggi: sosia,
        media: mediaSosia,
        massimo: maxSosia,
        punteggioVero: punteggioVero,
        /* Il verdetto: il modello vero deve battere il MIGLIORE dei sosia,
           non la loro media. Battere la media significa solo essere sopra
           il caso tipico; battere il massimo significa che in N tentativi
           il caso non ci e' mai arrivato. */
        superaIlCaso: maxSosia !== null && punteggioVero > maxSosia,
        margine: maxSosia !== null ? punteggioVero - maxSosia : null
      }
    };
  }

  /* Salti di attivita': coppie molto simili con attivita' molto diversa.
     Sono il punto in cui la relazione struttura-attivita' si rompe, e per un
     chimico medicinale sono la cosa piu' interessante dell'intero insieme:
     indicano dove un piccolo cambiamento vale molto. */
  function saltiAttivita(molecole, opzioni) {
    opzioni = opzioni || {};
    var sogliaSim = opzioni.sogliaSimilarita || 0.8;
    var sogliaDelta = opzioni.sogliaDelta || 1.0;
    var conY = molecole.filter(function (m) { return typeof m.attivita === 'number'; });
    var fps = conY.map(function (m) { return fingerprint(m.smiles, opzioni.fingerprint || 'morgan'); });
    var out = [];
    for (var i = 0; i < conY.length; i++) {
      if (!fps[i]) continue;
      for (var j = i + 1; j < conY.length; j++) {
        if (!fps[j]) continue;
        var sim = tanimoto(fps[i], fps[j]);
        if (sim < sogliaSim) continue;
        var delta = Math.abs(conY[i].attivita - conY[j].attivita);
        if (delta < sogliaDelta) continue;
        out.push({
          a: conY[i], b: conY[j], similarita: sim, delta: delta,
          /* SALI — Structure-Activity Landscape Index: quanto ripido e' il
             salto. Due molecole identiche darebbero divisione per zero:
             si limita il denominatore. */
          sali: delta / Math.max(1 - sim, 0.01)
        });
      }
    }
    out.sort(function (a, b) { return b.sali - a.sali; });
    return out;
  }

  /* Dominio di applicabilita': quanto e' lontana una molecola da tutto cio'
     che il modello ha visto. Una previsione su una molecola fuori dominio e'
     un'estrapolazione, e va segnalata come tale invece di essere presentata
     con la stessa faccia delle altre. */
  function dominioApplicabilita(fpQuery, fpsAddestramento, k) {
    k = k || 3;
    var v = viciniPiuSimili(fpQuery, fpsAddestramento, k);
    var media = v.reduce(function (a, x) { return a + x.s; }, 0) / v.length;
    return {
      similaritaMediaAiVicini: media,
      dentro: media >= 0.4,
      vicini: v
    };
  }

  /* ═══ §9-bis · Validazione incrociata raggruppata per scheletro ══════════

     Una divisione sola, su un insieme piccolo, produce un numero rumoroso:
     su 28 molecole al 25 % l'insieme di prova ne contiene sette, e spostare
     una molecola da una parte all'altra muove l'R² di decimi. Chi valuta il
     modello lo sa, e la prima domanda che fa e' «quanto vale la deviazione
     fra le pieghe?».

     Le pieghe raggruppano per SCHELETRO, non per molecola: un analogo della
     stessa serie in addestramento e in prova falsa la piega esattamente come
     falsava la divisione singola. Questa e' la ragione per cui non si usa un
     k-fold ordinario. */

  function pieghePerScaffold(molecole, k, seme) {
    k = k || 5;
    var gruppi = Object.create(null);
    molecole.forEach(function (m, i) {
      var s = m._scaffold !== undefined ? m._scaffold : (scaffoldMurcko(m.smiles) || {}).smiles;
      m._scaffold = s;
      var chiave = s || ('aciclica#' + i);
      (gruppi[chiave] = gruppi[chiave] || []).push(i);
    });
    var elenco = Object.keys(gruppi).map(function (c) { return gruppi[c]; });

    /* Ordinati per dimensione decrescente e assegnati alla piega piu' scarica:
       e' il modo piu' semplice di ottenere pieghe di dimensione simile senza
       spezzare un gruppo. Con meno gruppi che pieghe si restituiscono tante
       pieghe quanti sono i gruppi, e chi chiama lo vede dal risultato. */
    elenco.sort(function (a, b) { return b.length - a.length; });
    var r = rng((seme || 42) + 7);
    /* A parita' di dimensione l'ordine e' arbitrario: lo si fissa col
       generatore seminato, perche' due esecuzioni devono dare le stesse
       pieghe. */
    elenco.sort(function (a, b) {
      return b.length - a.length || (r() - 0.5);
    });
    var nPieghe = Math.min(k, elenco.length);
    var pieghe = [];
    for (var i = 0; i < nPieghe; i++) pieghe.push([]);
    elenco.forEach(function (g) {
      var piuScarica = 0;
      for (var j = 1; j < nPieghe; j++) {
        if (pieghe[j].length < pieghe[piuScarica].length) piuScarica = j;
      }
      pieghe[piuScarica] = pieghe[piuScarica].concat(g);
    });
    return { pieghe: pieghe, nGruppi: elenco.length, nPieghe: nPieghe };
  }

  function mediaEScarto(v) {
    var n = v.filter(function (x) { return typeof x === 'number' && isFinite(x); });
    if (!n.length) return { media: null, scarto: null, n: 0 };
    var mu = n.reduce(function (a, b) { return a + b; }, 0) / n.length;
    if (n.length < 2) return { media: mu, scarto: null, n: 1 };
    var s2 = n.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / (n.length - 1);
    return { media: mu, scarto: Math.sqrt(s2), n: n.length };
  }

  function validazioneIncrociata(molecole, opzioni) {
    opzioni = opzioni || {};
    var tipoFp = opzioni.fingerprint || 'morgan';
    var k = opzioni.pieghe || 5;
    var seme = opzioni.seme || 42;

    var conY = molecole.filter(function (m) { return typeof m.attivita === 'number'; });
    if (conY.length < 10) {
      throw new Error('servono almeno 10 molecole con attivita\' misurata: ne sono arrivate ' + conY.length);
    }
    var fps = [], mols = [];
    conY.forEach(function (m) {
      var f = fingerprint(m.smiles, tipoFp);
      if (f) { fps.push(f); mols.push(m); }
    });
    if (mols.length < 10) {
      throw new Error('meno di 10 molecole hanno prodotto un fingerprint valido');
    }
    var y = mols.map(function (m) { return m.attivita; });
    var distinti = Array.from(new Set(y));
    var classificazione = opzioni.classificazione !== undefined
      ? opzioni.classificazione
      : (distinti.length === 2 && distinti.every(function (v) { return v === 0 || v === 1; }));

    var p = pieghePerScaffold(mols, k, seme);

    /* Le predizioni di TUTTE le pieghe messe insieme: ogni molecola viene
       predetta una volta sola, da un modello che non l'ha vista. E' la
       tabella che si esporta, e l'unica che si puo' disegnare senza barare. */
    var previstoDiTutti = new Array(mols.length);
    var perPiega = [];
    var salti = 0;

    p.pieghe.forEach(function (prova, indice) {
      var addestramento = [];
      for (var i = 0; i < mols.length; i++) {
        if (prova.indexOf(i) === -1) addestramento.push(i);
      }
      if (!prova.length || !addestramento.length) { salti++; return; }

      var fpTr = addestramento.map(function (i) { return fps[i]; });
      var yTr = addestramento.map(function (i) { return y[i]; });
      var fpTe = prova.map(function (i) { return fps[i]; });
      var yTe = prova.map(function (i) { return y[i]; });

      /* Una piega in cui l'addestramento ha una sola classe non e'
         addestrabile: la logistica non ha nulla da separare. Si salta, e il
         conteggio dei salti finisce nel risultato: una validazione che ha
         saltato metà delle pieghe non è una validazione a cinque pieghe. */
      if (classificazione && new Set(yTr).size < 2) { salti++; return; }

      var previsti;
      if (classificazione) {
        var mc = addestraLogistica(fpTr, yTr, opzioni);
        previsti = fpTe.map(function (f) { return prediciLogistica(mc, f); });
      } else {
        var mr = addestraRidge(fpTr, yTr, opzioni.lambda);
        previsti = fpTe.map(function (f) { return prediciRidge(mr, f); });
      }
      prova.forEach(function (i, j) { previstoDiTutti[i] = previsti[j]; });

      perPiega.push({
        piega: indice + 1,
        nAddestramento: addestramento.length,
        nProva: prova.length,
        metriche: classificazione
          ? metricheClassificazione(yTe, previsti)
          : metricheRegressione(yTe, previsti)
      });
    });

    if (!perPiega.length) throw new Error('nessuna piega utilizzabile');

    var chiave = classificazione ? 'auc' : 'r2';
    var punteggi = perPiega.map(function (f) { return f.metriche[chiave]; });
    var agg = mediaEScarto(punteggi);

    /* Il punteggio su tutte le predizioni fuori piega riunite. Non coincide
       con la media delle pieghe — le pieghe hanno dimensioni diverse e
       varianze diverse — e le due cose insieme dicono piu' di ognuna da sola:
       se sono lontane, il modello dipende da quali molecole gli capitano. */
    var iCompleti = [];
    previstoDiTutti.forEach(function (v, i) { if (v !== undefined) iCompleti.push(i); });
    var yFuori = iCompleti.map(function (i) { return y[i]; });
    var pFuori = iCompleti.map(function (i) { return previstoDiTutti[i]; });
    var riunito = classificazione
      ? metricheClassificazione(yFuori, pFuori)
      : metricheRegressione(yFuori, pFuori);

    return {
      tipo: classificazione ? 'classificazione' : 'regressione',
      fingerprint: tipoFp,
      metrica: chiave,
      nTotali: mols.length,
      nScaffold: p.nGruppi,
      pieghieChieste: k,
      pieghe: perPiega.length,
      pieghieSaltate: salti,
      perPiega: perPiega,
      media: agg.media,
      scarto: agg.scarto,
      riunito: riunito,
      previsti: previstoDiTutti,
      molecole: mols
    };
  }

  /* ═══ §9-ter · Esportazione ══════════════════════════════════════════════

     Un banco di lavoro da cui i risultati non possono uscire non e' uno
     strumento: e' una dimostrazione. Chi lavora davvero riprende la tabella
     in un foglio di calcolo o in un notebook, e vuole accanto a ogni numero
     il metodo che l'ha prodotto.

     Tutto avviene nel browser: il file si forma in memoria e viene salvato
     dall'utente. Nessun dato esce dal dispositivo, esattamente come per il
     resto dell'applicazione. */

  function campoCsv(v) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    /* Il punto e virgola come separatore e la virgola decimale sono ciò che
       Excel in italiano si aspetta; ma il CSV deve restare leggibile anche
       da pandas, quindi si usa la virgola come separatore e il punto
       decimale, e si cita ogni campo che contenga un separatore. Uno SMILES
       contiene virgole quasi mai e virgolette mai, ma un NOME sì. */
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function esportaCsv(molecole, opzioni) {
    opzioni = opzioni || {};
    var colonneDesc = opzioni.descrittori ||
      ['MolWt', 'CrippenClogP', 'tpsa', 'NumHBD', 'NumHBA', 'NumRotatableBonds',
       'FractionCSP3', 'NumAromaticRings', 'exactmw'];
    var intest = ['nome', 'smiles_canonico', 'smiles_originale', 'attivita'];
    if (opzioni.scaffold !== false) intest.push('scaffold');
    colonneDesc.forEach(function (c) { intest.push(c); });
    if (opzioni.qed !== false) intest.push('qed');
    if (opzioni.regole !== false) intest.push('violazioni_lipinski', 'veber_ok');
    if (opzioni.allarmi) intest.push('allarmi');
    if (opzioni.gruppo) intest.push('gruppo');
    if (opzioni.previsto) intest.push('previsto', 'residuo');

    var righe = [intest.map(campoCsv).join(',')];
    molecole.forEach(function (m, i) {
      var d = null;
      try { d = descrittori(m.smiles); } catch (e) { d = null; }
      var r = [m.nome, m.smiles, m.originale || m.smiles,
               typeof m.attivita === 'number' ? m.attivita : ''];
      if (opzioni.scaffold !== false) {
        var s = m._scaffold !== undefined ? m._scaffold : (scaffoldMurcko(m.smiles) || {}).smiles;
        r.push(s || '');
      }
      colonneDesc.forEach(function (c) {
        var v = d ? d[c] : null;
        r.push(typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : (v === undefined ? '' : v));
      });
      if (opzioni.qed !== false) r.push(d && typeof d.qed === 'number' ? Math.round(d.qed * 1e4) / 1e4 : '');
      if (opzioni.regole !== false) {
        var L = d && d.regole && d.regole.lipinski, V = d && d.regole && d.regole.veber;
        r.push(L ? L.violazioni : '');
        r.push(V ? (V.violazioni === 0 ? 'si' : 'no') : '');
      }
      if (opzioni.allarmi) {
        var a = null;
        try { a = allarmi(m.smiles); } catch (e) { a = null; }
        r.push(a && a.allarmi.length
          ? a.allarmi.map(function (x) { return x.id; }).join(' | ')
          : '');
      }
      if (opzioni.gruppo) r.push(opzioni.gruppo[i] === undefined ? '' : opzioni.gruppo[i]);
      if (opzioni.previsto) {
        var p = opzioni.previsto[i];
        r.push(typeof p === 'number' ? Math.round(p * 1e4) / 1e4 : '');
        r.push(typeof p === 'number' && typeof m.attivita === 'number'
          ? Math.round((m.attivita - p) * 1e4) / 1e4 : '');
      }
      righe.push(r.map(campoCsv).join(','));
    });
    return righe.join('\n') + '\n';
  }

  /* ── Esportazione SDF ──────────────────────────────────────────────────

     Il CSV va bene per un foglio di calcolo; il formato con cui si scambiano
     insiemi di molecole fra gruppi e fra programmi e' l'SDF, che porta la
     struttura CON le coordinate e i campi dati attaccati a ogni voce.

     Le coordinate 2D vanno generate: `get_molblock()` su una molecola senza
     coordinate scrive un blocco con tutti gli atomi a (0,0), che ogni
     visualizzatore disegna come un grumo illeggibile. */
  function esportaSdf(molecole, opzioni) {
    opzioni = opzioni || {};
    var R = esigiRdkit();
    var campiDesc = opzioni.descrittori ||
      ['MolWt', 'CrippenClogP', 'tpsa', 'NumHBD', 'NumHBA', 'NumRotatableBonds'];
    var pezzi = [], scartate = [];

    molecole.forEach(function (mol, i) {
      var m = null;
      try {
        m = R.get_mol(mol.smiles);
        if (!m || !m.is_valid()) { scartate.push({ indice: i, motivo: 'SMILES non interpretabile' }); return; }
        try { m.set_new_coords(); } catch (e) { /* senza coordinate il blocco resta valido, solo brutto */ }
        var blocco = m.get_molblock();
        if (!blocco) { scartate.push({ indice: i, motivo: 'molblock vuoto' }); return; }

        /* La prima riga del molblock e' il nome: RDKit la lascia vuota, e un
           SDF senza nomi costringe chi lo riceve a contare le voci. */
        var righe = blocco.split('\n');
        if (righe.length) righe[0] = String(mol.nome || ('mol-' + (i + 1)));
        blocco = righe.join('\n');

        var campi = [];
        campi.push(['NOME', mol.nome || ('mol-' + (i + 1))]);
        campi.push(['SMILES_CANONICO', mol.smiles]);
        if (mol.originale && mol.originale !== mol.smiles) campi.push(['SMILES_ORIGINALE', mol.originale]);
        if (typeof mol.attivita === 'number') campi.push(['ATTIVITA', mol.attivita]);
        if (opzioni.previsto && typeof opzioni.previsto[i] === 'number') {
          campi.push(['PREVISTO', Math.round(opzioni.previsto[i] * 1e4) / 1e4]);
          if (typeof mol.attivita === 'number') {
            campi.push(['RESIDUO', Math.round((mol.attivita - opzioni.previsto[i]) * 1e4) / 1e4]);
          }
        }
        if (opzioni.descrittoriAttivi !== false) {
          var d = null;
          try { d = descrittori(mol.smiles); } catch (e) { d = null; }
          if (d) {
            campiDesc.forEach(function (c) {
              if (typeof d[c] === 'number') campi.push([c, Math.round(d[c] * 1e4) / 1e4]);
            });
            if (typeof d.qed === 'number') campi.push(['QED', Math.round(d.qed * 1e4) / 1e4]);
          }
        }
        if (opzioni.scaffold !== false) {
          var s = mol._scaffold !== undefined ? mol._scaffold : (scaffoldMurcko(mol.smiles) || {}).smiles;
          if (s) campi.push(['SCAFFOLD_MURCKO', s]);
        }
        (opzioni.campiExtra || []).forEach(function (c) {
          if (c && c.nome && c.valori && c.valori[i] !== undefined && c.valori[i] !== null) {
            campi.push([c.nome, c.valori[i]]);
          }
        });

        var testo = blocco.replace(/\n*$/, '\n');
        campi.forEach(function (c) {
          /* Il nome del campo non puo' contenere spazi ne' '>' o '<': chi
             legge l'SDF spezzerebbe sulla riga sbagliata. */
          var nome = String(c[0]).replace(/[<>\s]+/g, '_');
          testo += '> <' + nome + '>\n' + String(c[1]) + '\n\n';
        });
        testo += '$$$$\n';
        pezzi.push(testo);
      } catch (e) {
        scartate.push({ indice: i, motivo: e.message });
      } finally {
        if (m && m.delete) { try { m.delete(); } catch (e2) {} }
      }
    });

    return { sdf: pezzi.join(''), scritte: pezzi.length, scartate: scartate };
  }

  function n4(v) { return typeof v === 'number' && isFinite(v) ? v.toFixed(4) : '—'; }

  /* «R2» scritto cosi' e' il nome di una variabile, non di una metrica. */
  function nomeMetrica(k) { return k === 'r2' ? 'R\u00b2' : (k === 'auc' ? 'ROC-AUC' : k); }

  /* Il rapporto di metodo. Non e' un riassunto grazioso: e' l'insieme di cose
     che servono a RIFARE la stessa analisi e ottenere gli stessi numeri —
     compreso il seme, senza il quale «divisione casuale» non significa
     niente. */
  function rapportoMetodo(dati) {
    dati = dati || {};
    var m = dati.modello, cv = dati.cv, quando = new Date().toISOString().slice(0, 19).replace('T', ' ');
    var R = rdkit();
    var L = [];
    L.push('# Rapporto di metodo — analisi chemioinformatica');
    L.push('');
    L.push('| | |');
    L.push('|---|---|');
    L.push('| Prodotto da | BioSpecInfo, sezione Chemioinformatica |');
    L.push('| Motore | `bsi-cheminfo.js` · `window.BSIChem` |');
    L.push('| RDKit | ' + (R && R.version ? '`' + R.version() + '`' : 'non disponibile') + ' |');
    L.push('| Data (UTC) | ' + quando + ' |');
    L.push('| Dove è stato eseguito | interamente nel browser; nessun dato è uscito dal dispositivo |');
    L.push('');
    L.push('## Insieme di partenza');
    L.push('');
    L.push('- Molecole accettate: **' + (dati.nAccettate === undefined ? '—' : dati.nAccettate) + '**');
    L.push('- Righe scartate: **' + (dati.nScartate === undefined ? '—' : dati.nScartate) + '**' +
           (dati.motiviScarto && dati.motiviScarto.length
             ? ' (' + dati.motiviScarto.slice(0, 4).join('; ') + ')' : ''));
    L.push('- Standardizzazione: frammento con più atomi pesanti, SMILES canonico RDKit,');
    L.push('  deduplicazione **sul canonico** (due scritture della stessa molecola sono una).');
    L.push('');

    if (m) {
      L.push('## Modello — divisione singola');
      L.push('');
      L.push('| Parametro | Valore |');
      L.push('|---|---|');
      L.push('| Tipo | ' + m.tipo + ' |');
      L.push('| Metodo | ' + (m.tipo === 'classificazione'
        ? 'regressione logistica su fingerprint'
        : 'regressione kernel (ridge nel duale, kernel di Tanimoto)') + ' |');
      L.push('| Fingerprint | ' + m.fingerprint + ' |');
      L.push('| Divisione | ' + (m.divisione === 'scaffold'
        ? 'per scheletro di Bemis–Murcko (nessuno scheletro condiviso)'
        : 'casuale') + ' |');
      L.push('| Molecole | ' + m.nTotali + ' (' + m.nAddestramento + ' addestramento, ' +
             m.nProva + ' prova) |');
      L.push('| Scheletri distinti | ' + m.nScaffold + ' |');
      L.push('| Seme | ' + (dati.seme === undefined ? 42 : dati.seme) + ' |');
      L.push('');
      if (m.tipo === 'regressione') {
        L.push('R² ' + n4(m.metriche.r2) + ' · RMSE ' + n4(m.metriche.rmse) +
               ' · MAE ' + n4(m.metriche.mae) + ' · Pearson r ' + n4(m.metriche.pearson));
      } else {
        L.push('ROC-AUC ' + n4(m.metriche.auc) + ' · MCC ' + n4(m.metriche.mcc) +
               ' · accuratezza bilanciata ' + n4(m.metriche.accuratezzaBilanciata));
      }
      L.push('');
      var cn = m.controlloNullo;
      L.push('### Controllo nullo — rimescolamento delle etichette');
      L.push('');
      L.push('Lo stesso modello, riaddestrato ' + cn.ripetizioni +
             ' volte su etichette mescolate.');
      L.push('');
      L.push('- punteggio vero: **' + n4(cn.punteggioVero) + '**');
      L.push('- migliore dei sosia casuali: ' + n4(cn.massimo) +
             ' · media dei sosia: ' + n4(cn.media));
      L.push('- **verdetto: ' + (cn.superaIlCaso
        ? 'il modello batte tutti i sosia, margine ' + n4(cn.margine)
        : 'il modello NON batte il caso — il punteggio non è distinguibile dal rumore') + '**');
      L.push('');
    }

    if (cv) {
      L.push('## Validazione incrociata raggruppata per scheletro');
      L.push('');
      L.push('| Parametro | Valore |');
      L.push('|---|---|');
      L.push('| Pieghe chieste | ' + cv.pieghieChieste + ' |');
      L.push('| Pieghe usate | ' + cv.pieghe +
             (cv.pieghieSaltate ? ' (' + cv.pieghieSaltate + ' saltate: non addestrabili)' : '') + ' |');
      L.push('| Raggruppamento | per scheletro: nessuno scheletro sta in due pieghe |');
      L.push('| Scheletri distinti | ' + cv.nScaffold + ' su ' + cv.nTotali + ' molecole |');
      L.push('');
      L.push(nomeMetrica(cv.metrica) + ' per piega: ' +
             cv.perPiega.map(function (f) { return n4(f.metriche[cv.metrica]); }).join(' · '));
      L.push('');
      L.push('- media fra le pieghe: **' + n4(cv.media) + '**' +
             (cv.scarto === null ? '' : ' ± ' + n4(cv.scarto) + ' (deviazione standard)'));
      L.push('- su tutte le predizioni fuori piega riunite: **' +
             n4(cv.riunito[cv.metrica]) + '**');
      L.push('');
      L.push('> Le due cifre non coincidono, e non devono: le pieghe hanno dimensioni');
      L.push('> diverse. Se sono lontane fra loro, il modello dipende da quali molecole');
      L.push('> gli capitano in addestramento.');
      L.push('');
    }

    L.push('## Limiti di questa analisi');
    L.push('');
    L.push('- I descrittori e i fingerprint vengono da RDKit MinimalLib: la stessa');
    L.push('  libreria usata nella ricerca, compilata in WebAssembly.');
    L.push('- Un R² alto su poche decine di molecole resta un R² su poche decine di');
    L.push('  molecole. Il controllo nullo dice se è distinguibile dal caso, non se');
    L.push('  il modello si trasferirà a una serie chimica diversa.');
    L.push('- Gli allarmi PAINS segnalano composti che si sono comportati spesso da');
    L.push('  falsi positivi in saggi di fluorescenza. Non sono una condanna.');
    L.push('- Il dominio di applicabilità è misurato come similarità media ai vicini');
    L.push('  più prossimi nell\'insieme di addestramento: è un indicatore, non una');
    L.push('  soglia di validità.');
    L.push('');
    L.push('_Per rifare l\'analisi: stesso insieme, stesso fingerprint, stesso seme._');
    return L.join('\n') + '\n';
  }

  /* ═══ §9-quater · Frammentazione, coppie corrispondenti, SAR ═════════════

     Questo è il blocco che separa uno strumento didattico da uno strumento di
     lavoro. Un chimico farmaceutico non chiede «quanto si somigliano queste
     due molecole»: chiede «che cosa succede all'attività se sostituisco un
     cloro con un metile», e lo chiede su tutto l'insieme in una volta.

     MinimalLib non ha `FragmentOnBonds`. Ha però le reazioni, e una reazione
     SMARTS può tagliare un legame marcando i due capi con un atomo fittizio —
     è il taglio in stile BRICS/RECAP. Verificato all'esecuzione:

       CCOc1ccccc1  →  *CC + *Oc1ccccc1   ·   *OCC + *c1ccccc1
       c1ccccc1     →  nessun taglio (nessun legame singolo aciclico)

     Da lì viene tutto il resto. */

  /* Due regole di taglio, non una.

     FINE (predefinita) — qualunque legame singolo aciclico fra due atomi non
     fittizi. Comprende i sostituenti TERMINALI: Cl, CH3, OH, F. Senza di essi
     una tabella SAR perde proprio le colonne che interessano, ed è l'errore
     che questa funzione ha commesso alla prima stesura: trovava il sostituente
     sull'azoto e mancava il cloro sull'anello, perché il cloro è terminale.

     GROSSA — esclude gli atomi terminali, in stile BRICS. Produce parti
     variabili più grandi (un «clorofenile → fenile» invece di un «Cl → H») e
     serve quando l'insieme è grande e i tagli fini sono troppi.

     La regola fine è un soprainsieme della grossa: ogni taglio che la grossa
     trova, lo trova anche la fine. */
  var SMARTS_TAGLIO = {
    fine:   '[!$([#0]):1]-&!@[!$([#0]):2]>>[*:1]-[#0].[*:2]-[#0]',
    grossa: '[!$([#0])&!D1:1]-&!@[!$([#0])&!D1:2]>>[*:1]-[#0].[*:2]-[#0]'
  };
  var _rxnTaglio = Object.create(null);

  function reazioneTaglio(R, regola) {
    var nome = SMARTS_TAGLIO[regola] ? regola : 'fine';
    if (_rxnTaglio[nome]) return _rxnTaglio[nome];
    try { _rxnTaglio[nome] = R.get_rxn(SMARTS_TAGLIO[nome]); }
    catch (e) { _rxnTaglio[nome] = null; }
    return _rxnTaglio[nome];
  }

  /* Tutti i tagli singoli di una molecola, senza duplicati.

     La reazione restituisce ogni taglio DUE VOLTE, una per ciascun ordine dei
     prodotti: senza deduplicare, ogni coppia corrispondente verrebbe contata
     due volte e le statistiche per trasformazione raddoppierebbero. */
  function frammenta(smiles, regola) {
    var R = esigiRdkit();
    var rxn = reazioneTaglio(R, regola);
    if (!rxn) return [];
    var ml = null, m = null, prod = null;
    var visti = Object.create(null), tagli = [];
    try {
      m = R.get_mol(smiles);
      if (!m || !m.is_valid()) return [];
      ml = new R.MolList();
      ml.append(m);
      prod = rxn.run_reactants(ml, 500);
      var n = prod.size();
      for (var i = 0; i < n; i++) {
        var lista = prod.get(i);
        if (!lista || lista.size() !== 2) { if (lista && lista.delete) lista.delete(); continue; }
        var a = lista.at(0).get_smiles(), b = lista.at(1).get_smiles();
        if (lista.delete) lista.delete();
        if (!a || !b) continue;
        var chiave = a < b ? a + '\u0000' + b : b + '\u0000' + a;
        if (visti[chiave]) continue;
        visti[chiave] = 1;
        tagli.push([a, b]);
      }
    } catch (e) {
      return [];
    } finally {
      if (prod && prod.delete) { try { prod.delete(); } catch (e) {} }
      if (ml && ml.delete) { try { ml.delete(); } catch (e) {} }
      if (m && m.delete) { try { m.delete(); } catch (e) {} }
    }
    return tagli;
  }

  /* Il peso in atomi pesanti di un frammento, contato sulla stringa: serve a
     decidere quale dei due pezzi è il «contesto» e quale la «parte variabile».
     Si conta senza passare da RDKit perché su qualche migliaio di frammenti
     creare e distruggere una molecola per contare gli atomi costa più di tutto
     il resto dell'analisi. */
  function atomiPesantiStimati(smiles) {
    var s = String(smiles).replace(/\[[^\]]*\]/g, 'X').replace(/\*/g, '');
    var n = (s.match(/Cl|Br|[CNOSPFIBcnosp]|X/g) || []).length;
    return n;
  }

  /* ── Coppie molecolari corrispondenti ──────────────────────────────────

     Due molecole formano una coppia corrispondente quando, tagliando un
     legame in ciascuna, restano con lo STESSO contesto e due parti variabili
     diverse. La trasformazione è «parte di A → parte di B», e la differenza di
     attività è attribuita a quella sostituzione e a nient'altro.

     È il metodo standard per leggere una serie chimica, e la ragione per cui
     batte una correlazione su tutto l'insieme: confronta molecole che
     differiscono per UNA cosa sola, invece di mediare su molecole che
     differiscono per dieci. */
  function coppieCorrispondenti(molecole, opzioni) {
    opzioni = opzioni || {};
    esigiRdkit();
    var minAtomiContesto = opzioni.minAtomiContesto === undefined ? 5 : opzioni.minAtomiContesto;
    var maxAtomiVariabile = opzioni.maxAtomiVariabile === undefined ? 13 : opzioni.maxAtomiVariabile;
    var regola = opzioni.taglio === 'grossa' ? 'grossa' : 'fine';
    var conY = molecole.filter(function (m) { return typeof m.attivita === 'number'; });
    var insieme = opzioni.richiediAttivita === false ? molecole : conY;

    /* indice: contesto → [{i, variabile}] */
    var indice = Object.create(null);
    var frammentate = 0;
    insieme.forEach(function (mol, i) {
      var tagli = frammenta(mol.smiles, regola);
      if (tagli.length) frammentate++;
      tagli.forEach(function (coppia) {
        /* ogni taglio dà due letture: ciascun pezzo può fare da contesto */
        for (var k = 0; k < 2; k++) {
          var contesto = coppia[k], variabile = coppia[1 - k];
          if (atomiPesantiStimati(contesto) < minAtomiContesto) continue;
          if (atomiPesantiStimati(variabile) > maxAtomiVariabile) continue;
          (indice[contesto] = indice[contesto] || []).push({ i: i, v: variabile });
        }
      });
    });

    /* Dal contesto condiviso alle coppie. Una molecola può comparire più volte
       sotto lo stesso contesto (tagli diversi che danno lo stesso pezzo): si
       tiene una sola variabile per molecola per contesto, altrimenti la stessa
       coppia entrerebbe più volte. */
    var coppie = [];
    Object.keys(indice).forEach(function (contesto) {
      var voci = indice[contesto];
      var perMolecola = Object.create(null);
      voci.forEach(function (v) {
        if (perMolecola[v.i] === undefined) perMolecola[v.i] = v.v;
      });
      var indici = Object.keys(perMolecola);
      if (indici.length < 2) return;
      for (var a = 0; a < indici.length; a++) {
        for (var b = a + 1; b < indici.length; b++) {
          var ia = +indici[a], ib = +indici[b];
          var va = perMolecola[ia], vb = perMolecola[ib];
          if (va === vb) continue;              // stessa parte: non è una coppia
          coppie.push({
            contesto: contesto,
            a: { indice: ia, mol: insieme[ia], parte: va },
            b: { indice: ib, mol: insieme[ib], parte: vb },
            delta: (typeof insieme[ib].attivita === 'number' &&
                    typeof insieme[ia].attivita === 'number')
                   ? insieme[ib].attivita - insieme[ia].attivita : null
          });
        }
      }
    });

    /* ── Raggruppamento per trasformazione ──────────────────────────────
       La trasformazione X→Y e la sua inversa Y→X sono la stessa informazione
       con il segno opposto: si normalizza la direzione sull'ordine
       alfabetico, altrimenti lo stesso effetto comparirebbe due volte con
       mediane opposte e nessuna delle due avrebbe n giusto. */
    var gruppi = Object.create(null);
    coppie.forEach(function (c) {
      var da = c.a.parte, a = c.b.parte, delta = c.delta, invertita = false;
      if (da > a) { var t = da; da = a; a = t; delta = (delta === null ? null : -delta); invertita = true; }
      var chiave = da + '>>' + a;
      var g = gruppi[chiave] || (gruppi[chiave] = { da: da, a: a, delta: [], esempi: [] });
      if (delta !== null) g.delta.push(delta);
      if (g.esempi.length < 6) {
        g.esempi.push(invertita
          ? { da: c.b.mol, a: c.a.mol, delta: delta, contesto: c.contesto }
          : { da: c.a.mol, a: c.b.mol, delta: delta, contesto: c.contesto });
      }
    });

    var trasformazioni = Object.keys(gruppi).map(function (k) {
      var g = gruppi[k];
      var d = g.delta.slice().sort(function (x, y) { return x - y; });
      var ms = mediaEScarto(d);
      return {
        trasformazione: k, da: g.da, a: g.a,
        n: d.length,
        mediana: d.length ? (d.length % 2 ? d[(d.length - 1) / 2]
                                          : (d[d.length / 2 - 1] + d[d.length / 2]) / 2) : null,
        media: ms.media, scarto: ms.scarto,
        min: d.length ? d[0] : null, max: d.length ? d[d.length - 1] : null,
        /* Quante volte la sostituzione va nella stessa direzione: una mediana
           di +1,0 su 3 coppie di cui una a −2,0 non è la stessa cosa di +1,0
           su 3 coppie tutte positive, e la mediana da sola non lo dice. */
        concordanti: d.length ? Math.max(d.filter(function (x) { return x > 0; }).length,
                                         d.filter(function (x) { return x < 0; }).length) : 0,
        esempi: g.esempi
      };
    });

    /* Ordinate per |mediana| ma solo fra quelle con abbastanza coppie: una
       trasformazione vista una volta sola con Δ = +3 non è una scoperta, è un
       aneddoto, e metterla in cima farebbe prendere decisioni su di essa. */
    var minN = opzioni.minCoppie === undefined ? 2 : opzioni.minCoppie;
    var solide = trasformazioni.filter(function (t) { return t.n >= minN; });
    solide.sort(function (x, y) { return Math.abs(y.mediana) - Math.abs(x.mediana); });
    var aneddoti = trasformazioni.filter(function (t) { return t.n < minN; });

    return {
      molecoleEsaminate: insieme.length,
      molecoleFrammentate: frammentate,
      contestiCondivisi: Object.keys(indice).filter(function (c) {
        var s = Object.create(null);
        indice[c].forEach(function (v) { s[v.i] = 1; });
        return Object.keys(s).length >= 2;
      }).length,
      coppie: coppie.length,
      trasformazioni: solide,
      trasformazioniRare: aneddoti.length,
      minCoppie: minN
    };
  }

  /* ── Ricerca per sottostruttura su tutto l'insieme ─────────────────────

     MinimalLib ha `SubstructLibrary`, che è il motore di screening vero:
     indicizza le molecole con un pattern fingerprint e scarta in blocco
     quelle che non possono corrispondere, invece di provare l'isomorfismo su
     ognuna. È la differenza fra una ricerca che su diecimila molecole finisce
     e una che blocca la pagina. */
  function ricercaSottostruttura(molecole, query, opzioni) {
    opzioni = opzioni || {};
    var R = esigiRdkit();
    var lib = null, q = null;
    try {
      /* La query può essere SMARTS o SMILES. `get_qmol` legge lo SMARTS; se
         fallisce si prova come SMILES, perché chi cerca «c1ccccc1» non sta
         scrivendo uno SMARTS e non deve saperlo. */
      try { q = R.get_qmol(query); } catch (e) { q = null; }
      if (!q || !q.is_valid || !q.is_valid()) {
        if (q && q.delete) q.delete();
        q = null;
        try { q = R.get_mol(query); } catch (e2) { q = null; }
      }
      if (!q || (q.is_valid && !q.is_valid())) {
        return { errore: 'query non interpretabile come SMARTS né come SMILES', query: query };
      }
      lib = new R.SubstructLibrary();
      var validi = [];
      molecole.forEach(function (m, i) {
        try { lib.add_smiles(m.smiles); validi.push(i); }
        catch (e) { /* una molecola che la libreria rifiuta non ferma le altre */ }
      });
      var crudi = lib.get_matches(q);
      var idx = typeof crudi === 'string' ? JSON.parse(crudi) : crudi;
      var trovate = [].map.call(idx, function (k) { return validi[k]; })
                      .filter(function (k) { return k !== undefined; });

      /* Quante volte la query compare in ciascuna: una molecola con tre anelli
         benzenici non è equivalente a una che ne ha uno, e per un filtro
         («almeno due gruppi nitro») il conteggio è il dato che serve. */
      var occorrenze = {};
      if (opzioni.conteggiaOccorrenze !== false) {
        trovate.forEach(function (k) {
          var mm = null;
          try {
            mm = R.get_mol(molecole[k].smiles);
            var mt = JSON.parse(mm.get_substruct_matches(q));
            occorrenze[k] = mt ? mt.length : 0;
          } catch (e) { occorrenze[k] = null; }
          finally { if (mm && mm.delete) mm.delete(); }
        });
      }
      return {
        query: query,
        indicizzate: validi.length,
        scartate: molecole.length - validi.length,
        trovate: trovate,
        occorrenze: occorrenze,
        quante: trovate.length,
        frazione: molecole.length ? trovate.length / molecole.length : 0
      };
    } finally {
      if (q && q.delete) { try { q.delete(); } catch (e) {} }
      if (lib && lib.delete) { try { lib.delete(); } catch (e) {} }
    }
  }

  /* ── Decomposizione in gruppi R: la tabella SAR ────────────────────────

     È la tabella in cui vive la chimica farmaceutica: un nucleo comune in
     cima, una riga per molecola, una colonna per posizione di sostituzione.

     Il punto difficile non è trovare i sostituenti: è sapere IN QUALE
     POSIZIONE sta ognuno. La soluzione sfrutta una proprietà del taglio: il
     frammento che contiene il nucleo porta l'atomo fittizio esattamente nel
     punto di attacco. Facendo corrispondere il nucleo a quel frammento si
     scopre su quale atomo del nucleo è appeso il fittizio, e quindi quale
     posizione della query occupa il sostituente.

     Ne viene anche un filtro gratuito e necessario: se il fittizio NON è
     attaccato a un atomo del nucleo, il taglio è avvenuto dentro un
     sostituente, e quel pezzo non è il sostituente intero. Si scarta. */
  function decomposizioneRGruppi(molecole, nucleo, opzioni) {
    opzioni = opzioni || {};
    var R = esigiRdkit();
    var q = null;
    try { q = R.get_qmol(nucleo); } catch (e) { q = null; }
    if (!q || (q.is_valid && !q.is_valid())) {
      if (q && q.delete) q.delete();
      try { q = R.get_mol(nucleo); } catch (e) { q = null; }
    }
    if (!q || (q.is_valid && !q.is_valid())) {
      return { errore: 'nucleo non interpretabile', nucleo: nucleo };
    }

    var nAtomiNucleo = 0;
    try { nAtomiNucleo = q.get_num_atoms(); } catch (e) { nAtomiNucleo = 0; }

    /* Dal grafo: vicini di ogni atomo e numero atomico, per trovare il
       fittizio (z = 0) e chi gli sta accanto. */
    function grafo(smiles) {
      var m = null;
      try {
        m = R.get_mol(smiles);
        if (!m || !m.is_valid()) return null;
        var j = JSON.parse(m.get_json());
        var mol = (j.molecules && j.molecules[0]) || j;
        var atomi = (mol.atoms || []).map(function (a) { return a.z === undefined ? 6 : a.z; });
        var vicini = atomi.map(function () { return []; });
        (mol.bonds || []).forEach(function (b) {
          var x = b.atoms[0], y = b.atoms[1];
          vicini[x].push(y); vicini[y].push(x);
        });
        return { atomi: atomi, vicini: vicini, mol: m };
      } catch (e) {
        if (m && m.delete) { try { m.delete(); } catch (e2) {} }
        return null;
      }
    }

    var righe = [], senzaNucleo = [], posizioniViste = Object.create(null);

    molecole.forEach(function (mol, i) {
      /* Il nucleo c'è? Altrimenti la molecola non appartiene alla serie, e
         metterla nella tabella con le celle vuote la farebbe sembrare parte
         della serie con sostituenti non trovati. */
      var haNucleo = false, mm = null;
      try {
        mm = R.get_mol(mol.smiles);
        if (mm && mm.is_valid()) {
          var mt = JSON.parse(mm.get_substruct_matches(q));
          haNucleo = !!(mt && mt.length);
        }
      } catch (e) { haNucleo = false; }
      finally { if (mm && mm.delete) { try { mm.delete(); } catch (e2) {} } }
      if (!haNucleo) { senzaNucleo.push(i); return; }

      var erre = Object.create(null);
      frammenta(mol.smiles, opzioni.taglio === 'grossa' ? 'grossa' : 'fine').forEach(function (coppia) {
        for (var k = 0; k < 2; k++) {
          var conNucleo = coppia[k], sostituente = coppia[1 - k];
          var g = grafo(conNucleo);
          if (!g) continue;
          try {
            /* il nucleo deve stare per intero in questo frammento */
            var corr = JSON.parse(g.mol.get_substruct_matches(q));
            if (!corr || !corr.length) continue;
            /* il fittizio e il suo unico vicino */
            var fittizio = -1;
            for (var a = 0; a < g.atomi.length; a++) {
              if (g.atomi[a] === 0) { fittizio = a; break; }
            }
            if (fittizio < 0 || g.vicini[fittizio].length !== 1) continue;
            var attacco = g.vicini[fittizio][0];
            /* su quale posizione della query è appeso? */
            for (var c = 0; c < corr.length; c++) {
              var at = corr[c].atoms;
              var p = at.indexOf(attacco);
              if (p >= 0) {
                /* Una posizione già riempita da un taglio precedente non si
                   sovrascrive: due tagli diversi possono raggiungere la stessa
                   posizione e il primo è quello al legame col nucleo. */
                if (erre[p] === undefined) erre[p] = sostituente;
                posizioniViste[p] = 1;
                break;
              }
            }
          } catch (e) { /* un frammento illeggibile non ferma gli altri */ }
          finally { if (g.mol && g.mol.delete) { try { g.mol.delete(); } catch (e2) {} } }
        }
      });
      righe.push({ indice: i, mol: mol, r: erre });
    });

    var posizioni = Object.keys(posizioniViste).map(Number).sort(function (x, y) { return x - y; });
    /* Le posizioni che nessuna molecola riempie non diventano colonne: una
       colonna sempre vuota suggerisce un sostituente che non si è trovato,
       quando in realtà in quella posizione non ce n'è mai stato uno. */
    righe.forEach(function (r) {
      r.celle = posizioni.map(function (p) {
        return r.r[p] === undefined ? 'H' : r.r[p];
      });
    });

    /* Statistica per posizione: quanti sostituenti distinti, e se c'è
       attività, l'effetto mediano di ciascuno. È la lettura che serve. */
    var perPosizione = posizioni.map(function (p, colonna) {
      var gruppi = Object.create(null);
      righe.forEach(function (r) {
        var v = r.celle[colonna];
        (gruppi[v] = gruppi[v] || []).push(r);
      });
      var voci = Object.keys(gruppi).map(function (v) {
        var att = gruppi[v].map(function (r) { return r.mol.attivita; })
                           .filter(function (x) { return typeof x === 'number'; })
                           .sort(function (x, y) { return x - y; });
        return {
          sostituente: v, n: gruppi[v].length,
          attivitaMediana: att.length
            ? (att.length % 2 ? att[(att.length - 1) / 2]
                              : (att[att.length / 2 - 1] + att[att.length / 2]) / 2)
            : null
        };
      });
      voci.sort(function (x, y) {
        if (x.attivitaMediana === null || y.attivitaMediana === null) return y.n - x.n;
        return y.attivitaMediana - x.attivitaMediana;
      });
      return { posizione: p, colonna: colonna + 1, distinti: voci.length, voci: voci };
    });

    if (q.delete) { try { q.delete(); } catch (e) {} }
    return {
      nucleo: nucleo, atomiNucleo: nAtomiNucleo,
      righe: righe, posizioni: posizioni,
      colonne: posizioni.length,
      conNucleo: righe.length,
      senzaNucleo: senzaNucleo,
      perPosizione: perPosizione
    };
  }

  /* ═══ §9-quinquies · Il rigore che un valutatore pretende ════════════════

     Quattro cose che un gruppo di modellistica mette in ogni rapporto, e la
     cui assenza è la prima obiezione in riunione:

       1. un CONFRONTO con un riferimento banale, sulle stesse pieghe;
       2. una scelta degli iperparametri che non guardi l'insieme di prova;
       3. un INTERVALLO attorno a ogni predizione;
       4. per uno screening, l'ARRICCHIMENTO in testa alla lista, non l'AUC.
  */

  /* ── 1 · kNN sul kernel di Tanimoto ────────────────────────────────────
     Non è un riempitivo: sulle impronte molecolari il kNN è il metodo che la
     letteratura usa come riferimento difficile da battere, perché la
     similarità strutturale È già una buona predizione dell'attività. Un
     modello che non lo batte non sta aggiungendo niente. */
  function prediciKnn(fpsTrain, yTrain, fpQuery, k, pesato) {
    var v = viciniPiuSimili(fpQuery, fpsTrain, k || 5);
    if (!v.length) return null;
    if (pesato === false) {
      return v.reduce(function (a, x) { return a + yTrain[x.i]; }, 0) / v.length;
    }
    /* Pesato sulla similarità: un vicino a 0,8 conta più di uno a 0,3.
       Se tutti i pesi sono nulli (nessun bit in comune) si ricade sulla media
       semplice, perché dividere per zero darebbe NaN e un NaN che attraversa
       le metriche le rende tutte NaN senza dire dove è nato. */
    var sp = v.reduce(function (a, x) { return a + x.s; }, 0);
    if (sp <= 1e-12) return v.reduce(function (a, x) { return a + yTrain[x.i]; }, 0) / v.length;
    return v.reduce(function (a, x) { return a + x.s * yTrain[x.i]; }, 0) / sp;
  }

  /* ── 2 · Scelta degli iperparametri senza guardare la prova ────────────

     Provare dieci valori di lambda sull'insieme di prova e riportare il
     migliore è il modo più comune di gonfiare un R²: quel numero non è una
     predizione, è il massimo di dieci tentativi. La scelta va fatta DENTRO
     l'addestramento, su pieghe interne, e l'insieme di prova resta intatto.
     È la validazione annidata. */
  /* `addestra(candidato, fpsAddestramento, yAddestramento)` deve restituire
     UNA FUNZIONE che predice: addestra una volta per piega e la riusa su tutte
     le molecole di quella piega.

     La prima stesura prendeva invece `costruisci(candidato, fTr, yTr, query)`
     e la chiamava dentro `prova.map(...)`: per la regressione kernel questo
     significava COSTRUIRE LA MATRICE E RISOLVERE IL SISTEMA UNA VOLTA PER
     OGNI MOLECOLA DA PREDIRE. Misurato su 200 molecole: oltre duemila
     addestramenti dove ne servivano sessanta, e il confronto fra modelli
     bloccava la pagina per 7,3 secondi. Un solve 160x160 costa 5 ms: la
     moltiplicazione era tutta li'. */
  function scegliIperparametro(fps, y, candidati, addestra, pieghe, seme, classificazione) {
    pieghe = pieghe || 3;
    var n = fps.length, idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    var r = rng((seme || 42) + 99);
    for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var gruppi = [];
    for (i = 0; i < pieghe; i++) gruppi.push([]);
    idx.forEach(function (v, k) { gruppi[k % pieghe].push(v); });

    var migliore = null;
    candidati.forEach(function (c) {
      var punteggi = [];
      gruppi.forEach(function (prova) {
        var addestr = idx.filter(function (v) { return prova.indexOf(v) === -1; });
        if (!prova.length || !addestr.length) return;
        var fTr = addestr.map(function (v) { return fps[v]; });
        var yTr = addestr.map(function (v) { return y[v]; });
        if (classificazione && new Set(yTr).size < 2) return;
        /* UNA volta per piega, non una per molecola */
        var predici = addestra(c, fTr, yTr);
        if (typeof predici !== 'function') return;
        var prev = prova.map(function (v) { return predici(fps[v]); });
        var veri = prova.map(function (v) { return y[v]; });
        var m = classificazione ? metricheClassificazione(veri, prev)
                                : metricheRegressione(veri, prev);
        var p = classificazione ? m.auc : m.r2;
        if (p !== null && isFinite(p)) punteggi.push(p);
      });
      var agg = mediaEScarto(punteggi);
      if (agg.media !== null && (migliore === null || agg.media > migliore.punteggio)) {
        migliore = { valore: c, punteggio: agg.media, pieghe: punteggi.length };
      }
    });
    return migliore;
  }

  /* ── 3 · Confronto fra modelli sulle STESSE pieghe ─────────────────────

     Le stesse pieghe per tutti: confrontare un modello valutato su una
     divisione con un altro valutato su un'altra divisione non è un confronto,
     è un aneddoto doppio. E il riferimento banale — predire sempre la media —
     sta in cima all'elenco, perché è il numero che ogni altro deve battere. */
  function confrontoModelli(molecole, opzioni) {
    opzioni = opzioni || {};
    var tipoFp = opzioni.fingerprint || 'morgan';
    var k = opzioni.pieghe || 5;
    var seme = opzioni.seme || 42;

    var conY = molecole.filter(function (m) { return typeof m.attivita === 'number'; });
    if (conY.length < 10) {
      throw new Error('servono almeno 10 molecole con attivita\' misurata: ne sono arrivate ' + conY.length);
    }
    var fps = [], mols = [];
    conY.forEach(function (m) {
      var f = fingerprint(m.smiles, tipoFp);
      if (f) { fps.push(f); mols.push(m); }
    });
    var y = mols.map(function (m) { return m.attivita; });
    var distinti = Array.from(new Set(y));
    var classificazione = opzioni.classificazione !== undefined
      ? opzioni.classificazione
      : (distinti.length === 2 && distinti.every(function (v) { return v === 0 || v === 1; }));

    var p = pieghePerScaffold(mols, k, seme);
    var LAMBDA = opzioni.lambda || [0.1, 1, 10, 100];
    var KVIC = opzioni.k || [1, 3, 5, 10];

    var modelli = [];
    if (classificazione) {
      modelli.push({
        nome: 'Riferimento: classe piu\u0300 frequente',
        addestra: function (fTr, yTr) {
          var uno = yTr.filter(function (v) { return v === 1; }).length;
          var p1 = yTr.length ? uno / yTr.length : 0.5;
          return function () { return p1; };
        }
      });
      modelli.push({
        nome: 'kNN su Tanimoto',
        addestra: function (fTr, yTr) {
          var sc = scegliIperparametro(fTr, yTr, KVIC,
            function (kk, a, b) { return function (q) { return prediciKnn(a, b, q, kk); }; },
            3, seme, true);
          var kk = sc ? sc.valore : 5;
          return function (q) { return prediciKnn(fTr, yTr, q, kk); };
        }
      });
      modelli.push({
        nome: 'Regressione logistica',
        addestra: function (fTr, yTr) {
          var mod = addestraLogistica(fTr, yTr, opzioni);
          return function (q) { return prediciLogistica(mod, q); };
        }
      });
    } else {
      modelli.push({
        nome: 'Riferimento: media dell\'addestramento',
        addestra: function (fTr, yTr) {
          var mu = yTr.reduce(function (a, b) { return a + b; }, 0) / yTr.length;
          return function () { return mu; };
        }
      });
      modelli.push({
        nome: 'kNN su Tanimoto',
        addestra: function (fTr, yTr) {
          var sc = scegliIperparametro(fTr, yTr, KVIC,
            function (kk, a, b) { return function (q) { return prediciKnn(a, b, q, kk); }; },
            3, seme);
          var kk = sc ? sc.valore : 5;
          return function (q) { return prediciKnn(fTr, yTr, q, kk); };
        },
        iper: 'k'
      });
      modelli.push({
        nome: 'Regressione kernel (Tanimoto)',
        addestra: function (fTr, yTr) {
          var sc = scegliIperparametro(fTr, yTr, LAMBDA,
            function (lam, a, b) {
              var mm = addestraRidge(a, b, lam);     /* UNA volta per piega */
              return function (q) { return prediciRidge(mm, q); };
            }, 3, seme);
          var lam = sc ? sc.valore : 1;
          var mod = addestraRidge(fTr, yTr, lam);
          return function (q) { return prediciRidge(mod, q); };
        },
        iper: 'lambda'
      });
    }

    var chiave = classificazione ? 'auc' : 'r2';
    var esiti = modelli.map(function (M) {
      var perPiega = [], previstoDiTutti = new Array(mols.length), saltate = 0;
      p.pieghe.forEach(function (prova) {
        var addestr = [];
        for (var i = 0; i < mols.length; i++) if (prova.indexOf(i) === -1) addestr.push(i);
        if (!prova.length || !addestr.length) { saltate++; return; }
        var fTr = addestr.map(function (i) { return fps[i]; });
        var yTr = addestr.map(function (i) { return y[i]; });
        if (classificazione && new Set(yTr).size < 2) { saltate++; return; }
        var predici = M.addestra(fTr, yTr);
        var prev = prova.map(function (i) { return predici(fps[i]); });
        prova.forEach(function (i, j) { previstoDiTutti[i] = prev[j]; });
        var veri = prova.map(function (i) { return y[i]; });
        perPiega.push(classificazione ? metricheClassificazione(veri, prev)
                                      : metricheRegressione(veri, prev));
      });
      var punteggi = perPiega.map(function (m) { return m[chiave]; });
      var agg = mediaEScarto(punteggi);
      var compl = [];
      previstoDiTutti.forEach(function (v, i) { if (v !== undefined && v !== null) compl.push(i); });
      var riunito = compl.length
        ? (classificazione
            ? metricheClassificazione(compl.map(function (i) { return y[i]; }), compl.map(function (i) { return previstoDiTutti[i]; }))
            : metricheRegressione(compl.map(function (i) { return y[i]; }), compl.map(function (i) { return previstoDiTutti[i]; })))
        : null;
      return {
        nome: M.nome, iper: M.iper || null,
        perPiega: punteggi, media: agg.media, scarto: agg.scarto,
        pieghe: perPiega.length, saltate: saltate,
        riunito: riunito, previsti: previstoDiTutti
      };
    });

    /* Il verdetto scritto: il migliore batte il riferimento? E di quanto,
       rispetto alla dispersione fra le pieghe? Una differenza di 0,05 con
       scarti di 0,30 non è una differenza. */
    var rif = esiti[0];
    var altri = esiti.slice(1).filter(function (e) { return e.media !== null; });
    altri.sort(function (a, b) { return b.media - a.media; });
    var migliore = altri.length ? altri[0] : null;
    var margine = (migliore && rif.media !== null) ? migliore.media - rif.media : null;
    var dispersione = migliore && migliore.scarto !== null && rif.scarto !== null
      ? Math.sqrt(migliore.scarto * migliore.scarto + rif.scarto * rif.scarto) : null;

    return {
      tipo: classificazione ? 'classificazione' : 'regressione',
      metrica: chiave, fingerprint: tipoFp,
      nTotali: mols.length, nScaffold: p.nGruppi, pieghe: p.nPieghe, seme: seme,
      modelli: esiti,
      migliore: migliore ? migliore.nome : null,
      margineSulRiferimento: margine,
      dispersioneCombinata: dispersione,
      /* «Supera il riferimento» solo se il margine eccede la dispersione:
         altrimenti si sta leggendo rumore come se fosse un risultato. */
      superaIlRiferimento: (margine !== null && dispersione !== null)
        ? margine > dispersione : null,
      molecole: mols
    };
  }

  /* ── 4 · Intervalli di predizione conformi ─────────────────────────────

     Una predizione senza intervallo non si può usare in una decisione: «7,2»
     e «7,2 ± 0,3» sono due informazioni diverse, e solo la seconda dice se
     vale la pena sintetizzare.

     Metodo split-conformal, senza ipotesi sulla distribuzione degli errori:
     si tiene da parte una porzione di CALIBRAZIONE, si misurano i residui
     assoluti del modello su quella, e il quantile (1−alfa) di quei residui è
     la semiampiezza dell'intervallo. La garanzia è di copertura marginale:
     su dati scambiabili, almeno il (1−alfa) delle predizioni future cade
     dentro. Non è una barra d'errore inventata: è una quantile misurata. */
  function intervalliConformi(molecole, opzioni) {
    opzioni = opzioni || {};
    var alfa = opzioni.alfa === undefined ? 0.1 : opzioni.alfa;   // 90 %
    var tipoFp = opzioni.fingerprint || 'morgan';
    var seme = opzioni.seme || 42;
    var fraCal = opzioni.frazioneCalibrazione === undefined ? 0.3 : opzioni.frazioneCalibrazione;

    var conY = molecole.filter(function (m) { return typeof m.attivita === 'number'; });
    if (conY.length < 12) {
      throw new Error('per una calibrazione conforme servono almeno 12 molecole con attivita\': ne sono arrivate ' + conY.length);
    }
    var fps = [], mols = [];
    conY.forEach(function (m) { var f = fingerprint(m.smiles, tipoFp); if (f) { fps.push(f); mols.push(m); } });
    var y = mols.map(function (m) { return m.attivita; });

    /* ── Un rifiuto necessario ──────────────────────────────────────────
       Su un'attivita' BINARIA questa funzione produceva un intervallo con
       senso apparente e nessun significato: misurato, dava «0,122 [−0,017,
       0,261]» — un limite inferiore NEGATIVO per una grandezza che vale 0
       oppure 1, mostrato dal pannello con la stessa sicurezza di un valore
       buono.

       La predizione conforme per la classificazione esiste, ma non e' un
       intervallo: e' un INSIEME di etichette possibili, e si costruisce in
       un altro modo. Finche' non c'e', la risposta onesta e' rifiutare e
       dire quale strumento usare al suo posto. */
    var distintiY = Array.from(new Set(y));
    var binaria = distintiY.length === 2 &&
                  distintiY.every(function (v) { return v === 0 || v === 1; });
    if (binaria && opzioni.forzaRegressione !== true) {
      throw new Error('l\'attivita\' e\' binaria (0/1): un intervallo di predizione non ha ' +
                      'significato su una classificazione. Per lo screening usa le metriche di ' +
                      'arricchimento (EF, BEDROC); per una probabilita\' calibrata servirebbe la ' +
                      'predizione conforme a insiemi, che questo motore non ha.');
    }

    /* La divisione è PER SCAFFOLD anche qui: una calibrazione fatta su
       analoghi dell'addestramento misurerebbe residui troppo piccoli, e
       l'intervallo che ne esce sarebbe troppo stretto proprio sulle molecole
       nuove, cioè dove serve. */
    var div = divisionePerScaffold(mols, fraCal);
    var iAdd = div.addestramento, iCal = div.prova;
    if (iAdd.length < 5 || iCal.length < 4) {
      /* Con pochi scaffold la divisione per scaffold può sbilanciarsi: si
         ricade su quella casuale e LO SI DICHIARA nel risultato. */
      div = divisioneCasuale(mols.length, fraCal, seme);
      iAdd = div.addestramento; iCal = div.prova;
    }
    var perScaffold = div.nGruppi !== undefined;

    var mod = addestraRidge(iAdd.map(function (i) { return fps[i]; }),
                            iAdd.map(function (i) { return y[i]; }),
                            opzioni.lambda === undefined ? 1 : opzioni.lambda);
    var residui = iCal.map(function (i) { return Math.abs(y[i] - prediciRidge(mod, fps[i])); })
                      .sort(function (a, b) { return a - b; });

    /* Il quantile conforme: ceil((n+1)(1−alfa)) su n residui ordinati. È la
       formula che dà la garanzia di copertura, non il semplice percentile. */
    var n = residui.length;
    var pos = Math.ceil((n + 1) * (1 - alfa));
    var semiampiezza = pos <= n ? residui[pos - 1] : residui[n - 1];

    /* Copertura verificata sulla calibrazione stessa: deve essere ≥ 1−alfa.
       Non è una validazione indipendente — è un controllo di coerenza, e se
       fallisse vorrebbe dire che la formula del quantile è sbagliata. */
    var dentro = residui.filter(function (r) { return r <= semiampiezza; }).length;

    return {
      alfa: alfa, livello: 1 - alfa,
      semiampiezza: semiampiezza,
      nAddestramento: iAdd.length, nCalibrazione: n,
      divisione: perScaffold ? 'per scaffold' : 'casuale (troppo pochi scaffold)',
      coperturaSullaCalibrazione: n ? dentro / n : null,
      residuoMediano: n ? (n % 2 ? residui[(n - 1) / 2] : (residui[n / 2 - 1] + residui[n / 2]) / 2) : null,
      predici: function (smiles) {
        var f = fingerprint(smiles, tipoFp);
        if (!f) return null;
        var v = prediciRidge(mod, f);
        return { valore: v, basso: v - semiampiezza, alto: v + semiampiezza,
                 semiampiezza: semiampiezza, livello: 1 - alfa };
      }
    };
  }

  /* ── 5 · Arricchimento: la metrica dello screening ─────────────────────

     In uno screening non si guarda tutta la lista: si prendono i primi mille
     composti di centomila. Un ROC-AUC di 0,80 può nascondere una testa di
     lista senza un solo attivo, perché l'AUC premia anche l'ordine nella coda,
     che nessuno comprerà.

     EF a x % = (attivi trovati nel primo x %) / (attesi se a caso).
     BEDROC (Truchon & Bayly, J Chem Inf Model 2007) pesa esponenzialmente le
     posizioni in testa: alfa = 20 corrisponde a concentrarsi sul primo 8 %. */
  function arricchimento(etichette, punteggi, opzioni) {
    opzioni = opzioni || {};
    var frazioni = opzioni.frazioni || [0.01, 0.05, 0.10];
    var alfaBedroc = opzioni.alfaBedroc === undefined ? 20 : opzioni.alfaBedroc;

    var n = etichette.length;
    if (!n || punteggi.length !== n) {
      throw new Error('etichette e punteggi devono avere la stessa lunghezza non nulla');
    }
    var ord = [];
    for (var i = 0; i < n; i++) ord.push({ e: etichette[i] ? 1 : 0, s: punteggi[i], i: i });
    /* A parità di punteggio l'ordine deciderebbe l'arricchimento: si rompe la
       parità sull'indice, in modo che il risultato sia riproducibile e non
       dipenda dall'algoritmo di ordinamento del motore. */
    ord.sort(function (a, b) { return (b.s - a.s) || (a.i - b.i); });
    var attivi = ord.filter(function (x) { return x.e === 1; }).length;
    if (!attivi || attivi === n) {
      return { errore: 'serve almeno un attivo e un inattivo', attivi: attivi, totale: n };
    }
    var Ra = attivi / n;

    var ef = frazioni.map(function (f) {
      var cima = Math.max(1, Math.round(n * f));
      var trovati = 0;
      for (var k = 0; k < cima; k++) if (ord[k].e === 1) trovati++;
      return {
        frazione: f, composti: cima, attiviTrovati: trovati,
        attesiACaso: Ra * cima,
        ef: (Ra * cima) > 0 ? trovati / (Ra * cima) : null,
        /* L'arricchimento massimo possibile a quella frazione: un EF di 8 su
           un massimo di 10 è un risultato; su un massimo di 8 è il massimo. */
        efMassimo: Math.min(cima, attivi) / (Ra * cima)
      };
    });

    /* BEDROC, nella forma di Truchon & Bayly (2007), §2.3.
         somma    = Σ exp(−α·rᵢ/N)  sui ranghi 1-based degli attivi
         RIE      = (somma / n_attivi) / [ (1/N)·(1−e^{−α}) / (e^{α/N}−1) ]
         BEDROC   = RIE·(Ra·sinh(α/2)) / (cosh(α/2) − cosh(α/2 − α·Ra))
                    + 1/(1 − e^{α(1−Ra)})
       Scritta in questa forma e non «a occhio»: il termine additivo finale e'
       quello che porta BEDROC a 0 per un ordinamento pessimo invece che a un
       numero negativo senza significato. */
    var a2 = alfaBedroc / 2;
    var somma = 0;
    ord.forEach(function (x, k) {
      if (x.e === 1) somma += Math.exp(-alfaBedroc * (k + 1) / n);
    });
    var denomRie = (1 / n) * (1 - Math.exp(-alfaBedroc)) / (Math.exp(alfaBedroc / n) - 1);
    var rie = (somma / attivi) / denomRie;
    var bedroc = rie * (Ra * Math.sinh(a2)) /
                 (Math.cosh(a2) - Math.cosh(a2 - alfaBedroc * Ra)) +
                 1 / (1 - Math.exp(alfaBedroc * (1 - Ra)));

    return {
      totale: n, attivi: attivi, frazioneAttivi: Ra,
      auc: rocAuc(etichette, punteggi),
      ef: ef,
      rie: rie, bedroc: bedroc, alfaBedroc: alfaBedroc,
      /* La frazione in cui BEDROC concentra l'attenzione: alfa = 20 → 8 %. */
      finestraBedroc: 1 / alfaBedroc * Math.log(100)
    };
  }

  /* ── 6 · Curva di apprendimento ────────────────────────────────────────
     Risponde alla sola domanda che conta quando il modello è mediocre: serve
     piu' chimica o piu' dati? Se il punteggio sale ancora all'ultimo punto,
     piu' molecole aiuterebbero; se e' piatto da un pezzo, no. */
  function curvaApprendimento(molecole, opzioni) {
    opzioni = opzioni || {};
    var tipoFp = opzioni.fingerprint || 'morgan';
    var seme = opzioni.seme || 42;
    var frazioni = opzioni.frazioni || [0.25, 0.5, 0.75, 1.0];
    var k = opzioni.pieghe || 4;

    var conY = molecole.filter(function (m) { return typeof m.attivita === 'number'; });
    if (conY.length < 12) {
      throw new Error('per una curva di apprendimento servono almeno 12 molecole con attivita\'');
    }
    var fps = [], mols = [];
    conY.forEach(function (m) { var f = fingerprint(m.smiles, tipoFp); if (f) { fps.push(f); mols.push(m); } });
    var y = mols.map(function (m) { return m.attivita; });
    /* Su etichette binarie un R² non e' la metrica giusta: si usa l'AUC e
       SI DICHIARA quale delle due si sta guardando, perche' un punto «0,82»
       senza il nome della metrica non si puo' confrontare con niente. */
    var distintiC = Array.from(new Set(y));
    var classif = opzioni.classificazione !== undefined
      ? opzioni.classificazione
      : (distintiC.length === 2 && distintiC.every(function (v) { return v === 0 || v === 1; }));
    var chiaveC = classif ? 'auc' : 'r2';
    var p = pieghePerScaffold(mols, k, seme);
    var r = rng(seme + 555);

    var punti = frazioni.map(function (f) {
      var punteggi = [];
      p.pieghe.forEach(function (prova) {
        var addestr = [];
        for (var i = 0; i < mols.length; i++) if (prova.indexOf(i) === -1) addestr.push(i);
        /* si assottiglia SOLO l'addestramento: l'insieme di prova resta
           intero, altrimenti i punti non sarebbero confrontabili fra loro */
        var quanti = Math.max(3, Math.round(addestr.length * f));
        var mescolato = addestr.slice();
        for (var q = mescolato.length - 1; q > 0; q--) {
          var j = Math.floor(r() * (q + 1)); var t = mescolato[q]; mescolato[q] = mescolato[j]; mescolato[j] = t;
        }
        var usati = mescolato.slice(0, quanti);
        if (!prova.length || usati.length < 3) return;
        var yUsati = usati.map(function (i) { return y[i]; });
        if (classif && new Set(yUsati).size < 2) return;   // non addestrabile
        var prev;
        if (classif) {
          var ml = addestraLogistica(usati.map(function (i) { return fps[i]; }), yUsati, opzioni);
          prev = prova.map(function (i) { return prediciLogistica(ml, fps[i]); });
        } else {
          var mod = addestraRidge(usati.map(function (i) { return fps[i]; }), yUsati,
                                  opzioni.lambda === undefined ? 1 : opzioni.lambda);
          prev = prova.map(function (i) { return prediciRidge(mod, fps[i]); });
        }
        var veriP = prova.map(function (i) { return y[i]; });
        var m = classif ? metricheClassificazione(veriP, prev) : metricheRegressione(veriP, prev);
        var v = m[chiaveC];
        if (v !== null && isFinite(v)) punteggi.push(v);
      });
      var agg = mediaEScarto(punteggi);
      return { frazione: f, nAddestramentoTipico: Math.round(mols.length * (1 - 1 / p.nPieghe) * f),
               media: agg.media, scarto: agg.scarto, pieghe: punteggi.length };
    });

    var validi = punti.filter(function (x) { return x.media !== null; });
    var pendenzaFinale = validi.length >= 2
      ? validi[validi.length - 1].media - validi[validi.length - 2].media : null;

    return {
      punti: punti, nTotali: mols.length, pieghe: p.nPieghe,
      tipo: classif ? 'classificazione' : 'regressione',
      metrica: chiaveC,
      pendenzaFinale: pendenzaFinale,
      /* Il verdetto a parole: il guadagno fra gli ultimi due punti supera la
         dispersione? Se no, aggiungere molecole dello stesso tipo non aiuta. */
      piuDatiAiuterebbero: (pendenzaFinale !== null && validi.length >= 2 &&
                            validi[validi.length - 1].scarto !== null)
        ? pendenzaFinale > validi[validi.length - 1].scarto : null
    };
  }

  /* ═══ §10 · Superficie pubblica ══════════════════════════════════════════ */

  /* ═══════════════════════════════════════════════════════════════════════
     §10 · MODELLI E REGOLE AVANZATE
     ═══════════════════════════════════════════════════════════════════════ */

  /* ── 10.1 · ESOL (Delaney 2004) ────────────────────────────────────────
     La solubilita' in acqua stimata da quattro descrittori. L'equazione e'
     PUBBLICATA, e si scrive qui con i suoi coefficienti invece di adattarne
     di nuovi: un modello pubblicato, citato, e' verificabile da chiunque;
     uno adattato in casa su dati che non si mostrano, no.

       logS = 0,16 − 0,63·clogP − 0,0062·MW + 0,066·RB − 0,74·AP

     dove AP e' la frazione di atomi pesanti che sono aromatici. L'errore
     dichiarato dall'autore e' circa 1 unita' logaritmica: si riporta, perche'
     una stima senza il suo errore e' un numero che finge una precisione che
     non ha.
     Delaney, J.S. «ESOL: Estimating Aqueous Solubility Directly from
     Molecular Structure». J. Chem. Inf. Comput. Sci. 2004, 44, 1000-1005. */
  function solubilitaESOL(d) {
    if (!d) return null;
    var logP = (d.CrippenClogP != null) ? d.CrippenClogP : d.clogp;
    var mw   = (d.amw != null) ? d.amw : d.MolWt;
    var rb   = (d.NumRotatableBonds != null) ? d.NumRotatableBonds : d.numRotatableBonds;
    var nAro = (d.NumAromaticHeavyAtoms != null) ? d.NumAromaticHeavyAtoms
             : (d.numAromaticHeavyAtoms != null ? d.numAromaticHeavyAtoms : null);
    var nHea = (d.NumHeavyAtoms != null) ? d.NumHeavyAtoms : d.numHeavyAtoms;
    if (logP == null || mw == null || rb == null || nHea == null || !nHea) return null;
    var ap = (nAro == null) ? 0 : nAro / nHea;
    var logS = 0.16 - 0.63 * logP - 0.0062 * mw + 0.066 * rb - 0.74 * ap;
    return {
      logS: logS,
      mgPerL: Math.pow(10, logS) * mw * 1000,
      incertezza: 1.0,
      fonte: 'Delaney 2004 (ESOL)',
      frazioneAromatica: ap
    };
  }

  /* ── 10.2 · I filtri di drug-likeness ──────────────────────────────────
     Quattro regole pubblicate, ognuna con i suoi autori e le sue soglie. Si
     riportano TUTTE invece di fonderle in un voto unico: dicono cose diverse
     e si contraddicono spesso, e un unico semaforo verde nasconderebbe
     proprio l'informazione utile. */
  function filtriDrugLikeness(d) {
    if (!d) return null;
    var mw   = d.amw, logP = d.CrippenClogP, tpsa = d.tpsa;
    var hbd  = d.lipinskiHBD != null ? d.lipinskiHBD : d.NumHBD;
    var hba  = d.lipinskiHBA != null ? d.lipinskiHBA : d.NumHBA;
    var rb   = d.NumRotatableBonds, mr = d.CrippenMR, nHea = d.NumHeavyAtoms;
    function regola(nome, autori, condizioni) {
      var rotte = condizioni.filter(function (c) { return c.vero === false; });
      var ignote = condizioni.filter(function (c) { return c.vero == null; });
      return { nome: nome, autori: autori,
               passa: rotte.length === 0 && ignote.length === 0,
               violazioni: rotte.map(function (c) { return c.testo; }),
               nonValutabili: ignote.map(function (c) { return c.testo; }) };
    }
    function cond(testo, valore, prova) {
      return { testo: testo, vero: (valore == null ? null : prova(valore)) };
    }
    return [
      regola('Lipinski', 'Lipinski 1997', [
        cond('MW ≤ 500', mw, function (v) { return v <= 500; }),
        cond('clogP ≤ 5', logP, function (v) { return v <= 5; }),
        cond('donatori H ≤ 5', hbd, function (v) { return v <= 5; }),
        cond('accettori H ≤ 10', hba, function (v) { return v <= 10; })
      ]),
      regola('Veber', 'Veber 2002', [
        cond('legami ruotabili ≤ 10', rb, function (v) { return v <= 10; }),
        cond('TPSA ≤ 140 Å²', tpsa, function (v) { return v <= 140; })
      ]),
      regola('Egan', 'Egan 2000', [
        cond('clogP ≤ 5,88', logP, function (v) { return v <= 5.88; }),
        cond('TPSA ≤ 131,6 Å²', tpsa, function (v) { return v <= 131.6; })
      ]),
      regola('Ghose', 'Ghose 1999', [
        cond('160 ≤ MW ≤ 480', mw, function (v) { return v >= 160 && v <= 480; }),
        cond('−0,4 ≤ clogP ≤ 5,6', logP, function (v) { return v >= -0.4 && v <= 5.6; }),
        cond('40 ≤ rifrattivita\u0300 molare ≤ 130', mr, function (v) { return v >= 40 && v <= 130; }),
        cond('20 ≤ atomi pesanti ≤ 70', nHea, function (v) { return v >= 20 && v <= 70; })
      ])
    ];
  }

  /* ── 10.3 · Albero di regressione ──────────────────────────────────────
     Divide ricorsivamente i dati sul taglio che riduce di piu' la somma dei
     quadrati. Da solo e' instabile — ed e' proprio per questo che la foresta
     funziona: la media di molti alberi instabili e' stabile. */
  function alberoRegressione(X, y, indici, opz) {
    opz = opz || {};
    var profonditaMax = opz.profondita != null ? opz.profondita : 8;
    var minFoglia = opz.minFoglia != null ? opz.minFoglia : 3;
    var quanteVar = opz.quanteVariabili || null;
    var rnd = opz.rnd || Math.random;

    function media(ii) {
      var s = 0; ii.forEach(function (i) { s += y[i]; });
      return ii.length ? s / ii.length : 0;
    }
    function devianza(ii) {
      if (!ii.length) return 0;
      var m = media(ii), s = 0;
      ii.forEach(function (i) { s += (y[i] - m) * (y[i] - m); });
      return s;
    }

    function cresci(ii, prof) {
      var nodo = { valore: media(ii), n: ii.length };
      if (prof >= profonditaMax || ii.length < 2 * minFoglia) return nodo;
      var dev0 = devianza(ii);
      if (dev0 <= 1e-12) return nodo;
      var nVar = X[0].length;
      var colonne = [];
      for (var c = 0; c < nVar; c++) colonne.push(c);
      if (quanteVar && quanteVar < nVar) {
        /* sottoinsieme casuale di variabili: e' la seconda sorgente di
           diversita' fra gli alberi, dopo il bagging */
        for (var k = colonne.length - 1; k > 0; k--) {
          var j = Math.floor(rnd() * (k + 1));
          var tmp = colonne[k]; colonne[k] = colonne[j]; colonne[j] = tmp;
        }
        colonne = colonne.slice(0, quanteVar);
      }
      var migliore = null;
      colonne.forEach(function (c) {
        var valori = ii.map(function (i) { return X[i][c]; });
        var ordinati = valori.slice().sort(function (a, b) { return a - b; });
        var provati = {};
        for (var q = 1; q < ordinati.length; q++) {
          if (ordinati[q] === ordinati[q - 1]) continue;
          var taglio = (ordinati[q] + ordinati[q - 1]) / 2;
          if (provati[taglio]) continue;
          provati[taglio] = 1;
          var sx = [], dx = [];
          ii.forEach(function (i) { (X[i][c] <= taglio ? sx : dx).push(i); });
          if (sx.length < minFoglia || dx.length < minFoglia) continue;
          var guadagno = dev0 - devianza(sx) - devianza(dx);
          if (!migliore || guadagno > migliore.guadagno)
            migliore = { c: c, taglio: taglio, sx: sx, dx: dx, guadagno: guadagno };
        }
      });
      if (!migliore || migliore.guadagno <= 1e-12) return nodo;
      nodo.c = migliore.c; nodo.taglio = migliore.taglio;
      nodo.sx = cresci(migliore.sx, prof + 1);
      nodo.dx = cresci(migliore.dx, prof + 1);
      return nodo;
    }

    var radice = cresci(indici || X.map(function (_, i) { return i; }), 0);
    return {
      radice: radice,
      predici: function (x) {
        var n = radice;
        while (n.c !== undefined) n = (x[n.c] <= n.taglio) ? n.sx : n.dx;
        return n.valore;
      }
    };
  }

  /* ── 10.4 · Foresta casuale ────────────────────────────────────────────
     Bagging piu' sottoinsieme di variabili. Il seme e' esplicito: una foresta
     che cambia risposta a ogni esecuzione non si puo' verificare, e un
     modello che non si puo' verificare non si puo' usare per decidere. */
  function forestaCasuale(X, y, opz) {
    opz = opz || {};
    var nAlberi = opz.alberi || 100;
    var seme = opz.seme != null ? opz.seme : 42;
    var stato = seme >>> 0;
    function rnd() {
      /* generatore lineare congruenziale: deterministico e sufficiente */
      stato = (stato * 1664525 + 1013904223) >>> 0;
      return stato / 4294967296;
    }
    var n = X.length;
    if (!n || !X[0]) return null;
    var nVar = X[0].length;
    var quante = opz.quanteVariabili || Math.max(1, Math.round(nVar / 3));
    var alberi = [], ooB = [];
    for (var a = 0; a < nAlberi; a++) {
      var campione = [], dentro = {};
      for (var i = 0; i < n; i++) {
        var k = Math.floor(rnd() * n);
        campione.push(k); dentro[k] = 1;
      }
      alberi.push(alberoRegressione(X, y, campione, {
        profondita: opz.profondita, minFoglia: opz.minFoglia,
        quanteVariabili: quante, rnd: rnd
      }));
      var fuori = [];
      for (var j = 0; j < n; j++) if (!dentro[j]) fuori.push(j);
      ooB.push(fuori);
    }
    function predici(x) {
      var s = 0;
      alberi.forEach(function (t) { s += t.predici(x); });
      return s / alberi.length;
    }
    /* L'errore «fuori sacco»: ogni osservazione si predice con i soli alberi
       che non l'hanno vista. E' una stima onesta dell'errore senza bisogno di
       un insieme di prova separato — ed e' il motivo per cui si tiene traccia
       di chi e' rimasto fuori da ogni campione. */
    var somma = new Array(n).fill(0), conta = new Array(n).fill(0);
    alberi.forEach(function (t, a2) {
      ooB[a2].forEach(function (i) { somma[i] += t.predici(X[i]); conta[i]++; });
    });
    var res = [], usati = 0;
    for (var i2 = 0; i2 < n; i2++) {
      if (!conta[i2]) continue;
      usati++;
      res.push(y[i2] - somma[i2] / conta[i2]);
    }
    var mse = res.length ? res.reduce(function (s2, v) { return s2 + v * v; }, 0) / res.length : null;
    var mY = y.reduce(function (s2, v) { return s2 + v; }, 0) / n;
    var sst = y.reduce(function (s2, v) { return s2 + (v - mY) * (v - mY); }, 0) / n;
    return {
      predici: predici,
      alberi: alberi.length,
      variabiliPerNodo: quante,
      fuoriSacco: { usate: usati, rmse: mse != null ? Math.sqrt(mse) : null,
                    r2: (mse != null && sst > 0) ? 1 - mse / sst : null }
    };
  }

  globale.BSIChem = {
    /* preparazione */
    leggiTesto: leggiTesto,
    standardizza: standardizza,
    /* descrizione */
    descrittori: descrittori,
    regole: REGOLE,
    allarmi: allarmi,
    elencoAllarmi: ALLARMI,
    /* similarita' */
    fingerprint: fingerprint,
    tipiFingerprint: TIPI_FP,
    tanimoto: tanimoto,
    dice: dice,
    matriceSimilarita: matriceSimilarita,
    viciniPiuSimili: viciniPiuSimili,
    /* insiemi */
    butina: butina,
    maxmin: maxmin,
    scaffoldMurcko: scaffoldMurcko,
    pca: pca,
    /* modelli */
    divisionePerScaffold: divisionePerScaffold,
    divisioneCasuale: divisioneCasuale,
    costruisciModello: costruisciModello,
    pieghePerScaffold: pieghePerScaffold,
    validazioneIncrociata: validazioneIncrociata,
    saltiAttivita: saltiAttivita,
    /* frammentazione e SAR */
    frammenta: frammenta,
    coppieCorrispondenti: coppieCorrispondenti,
    ricercaSottostruttura: ricercaSottostruttura,
    /* rigore statistico */
    confrontoModelli: confrontoModelli,
    intervalliConformi: intervalliConformi,
    arricchimento: arricchimento,
    curvaApprendimento: curvaApprendimento,
    prediciKnn: prediciKnn,
    scegliIperparametro: scegliIperparametro,
    decomposizioneRGruppi: decomposizioneRGruppi,
    dominioApplicabilita: dominioApplicabilita,
    /* esportazione */
    esportaCsv: esportaCsv,
    esportaSdf: esportaSdf,
    rapportoMetodo: rapportoMetodo,
    /* metriche, esposte perche' un banco possa verificarle da sole */
    mediaEScarto: mediaEScarto,
    metricheRegressione: metricheRegressione,
    metricheClassificazione: metricheClassificazione,
    rocAuc: rocAuc,
    pearson: pearson,
    /* algebra, idem */
    jacobi: jacobi,
    risolvi: risolvi,
    /* §10 · modelli e regole avanzate */
    solubilitaESOL: solubilitaESOL,
    filtriDrugLikeness: filtriDrugLikeness,
    forestaCasuale: forestaCasuale,
    alberoRegressione: alberoRegressione,
    /* stato */
    pronto: function () { return rdkit() !== null; },
    versioneRDKit: function () { var R = rdkit(); return R && R.version ? R.version() : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
