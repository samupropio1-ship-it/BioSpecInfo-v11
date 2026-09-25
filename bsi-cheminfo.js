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
      if (!tenuti.length) return { smiles: '', aciclica: true, atomi: 0 };

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
      return {
        smiles: scaffoldSmiles(R, smiles, tenuti),
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

  /* ═══ §10 · Superficie pubblica ══════════════════════════════════════════ */
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
    saltiAttivita: saltiAttivita,
    dominioApplicabilita: dominioApplicabilita,
    /* metriche, esposte perche' un banco possa verificarle da sole */
    metricheRegressione: metricheRegressione,
    metricheClassificazione: metricheClassificazione,
    rocAuc: rocAuc,
    pearson: pearson,
    /* algebra, idem */
    jacobi: jacobi,
    risolvi: risolvi,
    /* stato */
    pronto: function () { return rdkit() !== null; },
    versioneRDKit: function () { var R = rdkit(); return R && R.version ? R.version() : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
