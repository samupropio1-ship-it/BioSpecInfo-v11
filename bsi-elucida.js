/* ═══════════════════════════════════════════════════════════════════════════
   BSI ELUCIDA — dai dati spettrali alla struttura, dicendo che cosa si deduce
                 e che cosa invece si sta solo supponendo

   A CHE COSA SERVE

   Ai quesiti del tipo «identificare la struttura del composto di formula
   C₉H₁₀O₂S che genera i seguenti spettri ¹H-NMR, ¹³C-NMR, FT-IR ed EI-MS».
   Il mestiere, lì, è una catena di deduzioni corte e sicure — gradi di
   insaturazione, numero di carboni dal picco M+1, perdite neutre, classi di
   carbonio dagli spostamenti — seguita da un salto: «allora è questa».

   Questo modulo fa tutta la catena e NON fa il salto. Produce un DOSSIER di
   deduzioni, ognuna con la propria prova e il proprio margine, e poi mette a
   confronto una struttura PROPOSTA con i dati, segnale per segnale, dicendo
   che cosa torna e che cosa no.

   PERCHE' NON FA IL SALTO

   Dedurre la struttura da zero — generare tutti gli isomeri compatibili e
   ordinarli — si chiama CASE, Computer-Assisted Structure Elucidation, ed è
   un problema di ricerca, non una funzione. Un programma che sputasse una
   struttura sola darebbe una certezza che i dati non contengono: per
   C₉H₁₀O₂S ci sono migliaia di isomeri, e gli spettri ne escludono molti ma
   non tutti tranne uno.

   Quello che si può fare con onestà è:
     · dire tutto quello che i dati IMPONGONO (il numero di insaturazioni non
       è un'opinione);
     · elencare quello che SUGGERISCONO, con il margine;
     · e verificare una proposta, mostrando dove casca.

   È anche il modo in cui si impara: la risposta non serve, serve vedere
   perché quella e non un'altra.

   USO   BSIElucida.dossier({formula, ms, ir, h1, c13})
         BSIElucida.confronta(smilesProposto, dati)
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · La formula molecolare

     Si legge, si conta, e da lì escono due numeri che non sono opinioni.
     ═════════════════════════════════════════════════════════════════════════ */
  var MASSA = { H:1.00794, C:12.0107, N:14.0067, O:15.9994, F:18.9984,
    Na:22.9898, Si:28.0855, P:30.9738, S:32.065, Cl:35.453, K:39.0983,
    Br:79.904, I:126.904, B:10.811, Se:78.971 };
  /* massa dell'isotopo piu' abbondante: e' quella che si legge come M⁺ in un
     EI-MS a bassa risoluzione, non la massa media */
  var MONO = { H:1.00783, C:12.0000, N:14.00307, O:15.99491, F:18.99840,
    Na:22.98977, Si:27.97693, P:30.97376, S:31.97207, Cl:34.96885,
    K:38.96371, Br:78.91834, I:126.90447, B:11.00931, Se:79.91652 };
  /* valenza usata per i gradi di insaturazione */
  var VALENZA = { H:1, F:1, Cl:1, Br:1, I:1, O:2, S:2, Se:2, N:3, P:3,
    C:4, Si:4, B:3, Na:1, K:1 };

  function leggiFormula(f) {
    if (!f) return null;
    var s = String(f).replace(/\s+/g, '');
    /* si accettano i pedici tipografici, che è come la formula compare sui
       testi: C₉H₁₀O₂S */
    var ped = '₀₁₂₃₄₅₆₇₈₉';
    s = s.replace(/[₀-₉]/g, function (c) { return String(ped.indexOf(c)); });
    var re = /([A-Z][a-z]?)(\d*)/g, m, conta = {}, visti = 0;
    while ((m = re.exec(s)) !== null) {
      if (!m[1]) continue;
      visti++;
      conta[m[1]] = (conta[m[1]] || 0) + (m[2] ? parseInt(m[2], 10) : 1);
    }
    if (!visti) return null;
    /* un simbolo che non conosciamo rende il conto insensato: meglio dirlo */
    var ignoti = Object.keys(conta).filter(function (e) { return !VALENZA[e]; });
    return { conta: conta, ignoti: ignoti };
  }

  /* Gradi di insaturazione (IDI / DBE), nella forma generale che vale per
     qualunque insieme di elementi:
         IDI = 1 + Σ nᵢ (vᵢ − 2) / 2
     Per CcHhNnOo si riduce a c − h/2 + n/2 + 1, che è quella che si scrive a
     mano. Scriverla in forma generale evita di dover elencare i casi, e
     gestisce da sé zolfo, alogeni e silicio. */
  function insaturazioni(conta) {
    var s = 2;
    Object.keys(conta).forEach(function (e) {
      var v = VALENZA[e];
      if (v === undefined) return;
      s += conta[e] * (v - 2);
    });
    return s / 2;
  }

  function massaDa(conta, tabella) {
    var m = 0, ok = true;
    Object.keys(conta).forEach(function (e) {
      if (tabella[e] === undefined) { ok = false; return; }
      m += tabella[e] * conta[e];
    });
    return ok ? m : null;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Lo spettro di massa

     Due conti che a mano si fanno sempre, e che è facile sbagliare.
     ═════════════════════════════════════════════════════════════════════════ */

  /* Numero di carboni dal rapporto M+1 / M.
     Il ¹³C è l'1,1 % del carbonio naturale, quindi ogni carbonio aggiunge
     circa l'1,1 % di intensità al picco M+1:
         nC ≈ (I(M+1) / I(M)) × 100 / 1,1
     È una STIMA, e il margine va detto: su un M+1 piccolo basta un errore di
     lettura dell'intensità per spostare il risultato di un carbonio o due.
     Contribuiscono anche ¹⁵N (0,37 % per azoto) e ³³S (0,76 %), che qui
     vengono sottratti se la formula li dichiara. */
  function carboniDaM1(intM, intM1, conta) {
    if (!intM || !isFinite(intM) || !isFinite(intM1)) return null;
    var rap = intM1 / intM * 100;
    var corr = 0;
    if (conta) {
      if (conta.N) corr += conta.N * 0.37;
      if (conta.S) corr += conta.S * 0.76;
      if (conta.Si) corr += conta.Si * 5.1;
    }
    var n = (rap - corr) / 1.1;
    return { rapporto: Math.round(rap * 10) / 10, correzione: Math.round(corr * 10) / 10,
             nC: Math.round(n), nCgrezzo: Math.round(n * 10) / 10,
             margine: Math.max(1, Math.round(n * 0.15)) };
  }

  /* Il picco M+2 dice quali eteroatomi ci sono, e lo dice forte:
     Cl ≈ 32,5 %, Br ≈ 97,3 %, S ≈ 4,4 %, Si ≈ 3,4 %. */
  var M2 = [
    ['Cl', 32.5, 'un cloro', 'one chlorine'],
    ['Cl₂', 65.0, 'due clori (e un M+4 a ~10,6 %)', 'two chlorines (plus M+4 at ~10.6%)'],
    ['Br', 97.3, 'un bromo (M e M+2 quasi uguali)', 'one bromine (M and M+2 nearly equal)'],
    ['Br₂', 195, 'due bromi', 'two bromines'],
    ['S', 4.4, 'uno zolfo', 'one sulfur'],
    ['Si', 3.4, 'un silicio', 'one silicon']
  ];
  function eteroDaM2(intM, intM2) {
    if (!intM || !isFinite(intM2)) return null;
    var r = intM2 / intM * 100;
    var vicino = null, best = Infinity;
    M2.forEach(function (x) {
      var d = Math.abs(x[1] - r);
      /* la tolleranza è proporzionale: su Br un 10 % di scarto non cambia la
         conclusione, su S sì */
      var tol = Math.max(1.2, x[1] * 0.25);
      if (d < tol && d < best) { best = d; vicino = x; }
    });
    return { rapporto: Math.round(r * 10) / 10,
             indizio: vicino ? t(vicino[2], vicino[3]) : null,
             elemento: vicino ? vicino[0] : null };
  }

  /* Perdite neutre: la differenza fra due ioni dice che cosa se n'è andato.
     Tabella estesa rispetto a quella del lettore di spettri, con i casi che
     tornano negli esami. */
  var PERDITE = [
    [1,  'H',        'radicale idrogeno'],
    [15, 'CH₃',      'metile — tipico dei metili su carbonio quaternario o su S'],
    [16, 'O / NH₂',  'ossigeno (nitro, solfossidi) o ammina primaria'],
    [17, 'OH',       'ossidrile — acidi, alcoli'],
    [18, 'H₂O',      'acqua — alcoli, acidi'],
    [26, 'C₂H₂',     'acetilene — aromatici'],
    [27, 'HCN',      'acido cianidrico — azotati aromatici, nitrili'],
    [28, 'CO / C₂H₄','monossido di carbonio (fenoli, chinoni, furani) o etilene'],
    [29, 'CHO / C₂H₅','formile (aldeidi) o etile'],
    [30, 'CH₂O / NO','formaldeide o nitroso'],
    [31, 'OCH₃',     'metossile — esteri metilici: è la perdita che li tradisce'],
    [32, 'CH₃OH',    'metanolo — esteri metilici'],
    [33, 'SH',       'tiolo'],
    [35, 'Cl',       'cloro'],
    [42, 'C₃H₆ / CH₂CO','propene o chetene (acetati)'],
    [43, 'C₃H₇ / CH₃CO','propile o acetile'],
    [44, 'CO₂',      'anidride carbonica — acidi, esteri'],
    [45, 'COOH / OC₂H₅','carbossile o etossile'],
    [46, 'NO₂ / HCOOH','nitro o acido formico'],
    [47, 'SCH₃',     'tiometile'],
    [59, 'COOCH₃',   'metossicarbonile — esteri metilici'],
    [60, 'CH₃COOH',  'acido acetico — acetati'],
    [73, 'COOC₂H₅',  'etossicarbonile'],
    [79, 'Br',       'bromo'],
    [91, 'C₇H₇',     'tropilio — benzilici (è un FRAMMENTO, non una perdita)'],
    [127,'I',        'iodio']
  ];

  function perditeFra(picchi) {
    var fuori = [];
    var ord = picchi.slice().sort(function (a, b) { return b.mz - a.mz; });
    for (var i = 0; i < ord.length; i++) {
      for (var j = i + 1; j < ord.length; j++) {
        var d = Math.round(ord[i].mz - ord[j].mz);
        if (d <= 0 || d > 130) continue;
        PERDITE.forEach(function (p) {
          if (p[0] !== d) return;
          fuori.push({ da: ord[i].mz, a: ord[j].mz, delta: d,
                       frammento: p[1], nota: p[2],
                       intDa: ord[i].i, intA: ord[j].i });
        });
      }
    }
    /* le perdite dal picco molecolare contano piu' delle altre: si ordinano
       per intensita' dello ione di partenza */
    fuori.sort(function (a, b) { return (b.intDa || 0) - (a.intDa || 0); });
    return fuori;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Leggere al CONTRARIO le tabelle NMR

     Il predittore va dalla struttura allo spostamento. Qui serve l'inverso:
     dato uno spostamento, quali classi di carbonio o di protone lo possono
     dare. Non è un'inversione esatta — molte classi si sovrappongono — e
     infatti si restituiscono TUTTE le compatibili, non la prima.
     ═════════════════════════════════════════════════════════════════════════ */
  var INTERVALLI_C = [
    [205, 225, 'C=O chetone', 'ketone C=O'],
    [195, 205, 'C=O aldeide / chetone arilico', 'aldehyde / aryl ketone C=O'],
    [165, 185, 'C=O acido, estere o ammide', 'acid, ester or amide C=O'],
    [155, 170, 'C aromatico legato a O o N; C=N', 'aromatic C–O/N; C=N'],
    [140, 160, 'C aromatico sostituito; C del furano in α all’O',
               'substituted aromatic C; furan α-C'],
    [125, 145, 'C aromatico o alchenico', 'aromatic or alkenic C'],
    [110, 130, 'C aromatico/alchenico schermato; nitrile; furano in β',
               'shielded aromatic/alkenic C; nitrile; furan β-C'],
    [100, 115, 'C aromatico molto schermato (orto/para a O o N); =CH₂',
               'strongly shielded aromatic C; =CH₂'],
    [70, 90,  'C–O di etere/alcol secondario o terziario; C di alchino',
              'ether/secondary or tertiary alcohol C–O; alkyne C'],
    [55, 75,  'C–O primario (CH₂–O, CH₃–O)', 'primary C–O'],
    [40, 60,  'C–N; CH alifatico sostituito', 'C–N; substituted aliphatic CH'],
    [25, 45,  'CH₂ alifatico; CH₃ in α a C=O', 'aliphatic CH₂; CH₃ α to C=O'],
    [10, 30,  'CH₃ alifatico; CH₂ in β', 'aliphatic CH₃; β CH₂'],
    [-5, 20,  'CH₃ molto schermato (S–CH₃, Si–CH₃, ciclopropano)',
              'strongly shielded CH₃ (S–CH₃, Si–CH₃, cyclopropane)']
  ];
  var INTERVALLI_H = [
    [9.0, 10.5, 'H aldeidico', 'aldehyde H'],
    [10.0, 13.5, 'H di acido carbossilico (largo, scambiabile)',
                 'carboxylic acid H (broad, exchangeable)'],
    [6.5, 8.5, 'H aromatico o eteroaromatico', 'aromatic or heteroaromatic H'],
    [5.8, 7.0, 'H del furano in β; H vinilico coniugato',
               'furan β-H; conjugated vinylic H'],
    [4.5, 6.5, 'H vinilico; H–C–O di estere allilico', 'vinylic H; allylic ester H–C–O'],
    [3.3, 4.5, 'H su carbonio legato a O (CH–O, CH₂–O, CH₃–O)', 'H on C–O'],
    [2.5, 3.5, 'H su carbonio legato a N; CH₂ benzilico', 'H on C–N; benzylic CH₂'],
    [2.0, 2.8, 'H in α a un carbonile; CH₃ di chetone', 'H α to C=O; ketone CH₃'],
    [1.8, 2.6, 'S–CH₃, S–CH₂ (tioeteri)', 'S–CH₃, S–CH₂ (thioethers)'],
    [1.0, 2.0, 'CH₂ alifatico', 'aliphatic CH₂'],
    [0.5, 1.5, 'CH₃ alifatico', 'aliphatic CH₃'],
    [0.0, 5.5, 'O–H o N–H (larghi, scambiano con D₂O)',
               'O–H or N–H (broad, exchange with D₂O)']
  ];

  function classiPer(ppm, tabella) {
    var fuori = [];
    tabella.forEach(function (r) {
      if (ppm >= r[0] && ppm <= r[1]) fuori.push(t(r[2], r[3]));
    });
    return fuori;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · Il dossier
     ═════════════════════════════════════════════════════════════════════════ */
  function normalizzaPicchi(ms) {
    if (!ms) return [];
    if (typeof ms === 'string') {
      /* due colonne «m/z intensità», come le liste stampate sui testi */
      return ms.split(/\r?\n/).map(function (r) {
        var p = r.trim().split(/[,;\t\s]+/).filter(function (x) { return x !== ''; });
        if (p.length < 1) return null;
        var mz = parseFloat(p[0]), i = (p.length > 1) ? parseFloat(p[1]) : 1;
        if (!isFinite(mz)) return null;
        return { mz: mz, i: isFinite(i) ? i : 1 };
      }).filter(Boolean);
    }
    return ms.map(function (x) {
      if (typeof x === 'number') return { mz: x, i: 1 };
      return { mz: +x.mz, i: isFinite(+x.i) ? +x.i : 1 };
    }).filter(function (x) { return isFinite(x.mz); });
  }

  function dossier(d) {
    d = d || {};
    var r = { deduzioni: [], supposizioni: [], avvisi: [] };

    /* ── la formula ── */
    var F = leggiFormula(d.formula);
    if (F) {
      if (F.ignoti.length) {
        r.avvisi.push(t('elementi non riconosciuti nella formula: ',
                        'unrecognised elements in the formula: ') + F.ignoti.join(', '));
      }
      var idi = insaturazioni(F.conta);
      r.formula = F.conta;
      r.idi = idi;
      r.massaMono = massaDa(F.conta, MONO);
      r.massaMedia = massaDa(F.conta, MASSA);
      r.deduzioni.push({
        che: t('Gradi di insaturazione (IDI)', 'Degrees of unsaturation (DBE)'),
        valore: idi,
        prova: t('dalla formula, con IDI = 1 + Σ nᵢ(vᵢ−2)/2',
                 'from the formula, with DBE = 1 + Σ nᵢ(vᵢ−2)/2'),
        certezza: t('esatta: è aritmetica, non interpretazione',
                    'exact: it is arithmetic, not interpretation'),
        nota: idi >= 4
          ? t('4 o più: un anello aromatico da solo ne vale 4 (tre doppi legami e un ciclo)',
              '4 or more: an aromatic ring alone accounts for 4 (three double bonds and a ring)')
          : (idi === 0 ? t('nessuna insaturazione: niente anelli, niente doppi legami',
                           'no unsaturation: no rings, no double bonds') : '')
      });
      if (r.massaMono) {
        r.deduzioni.push({
          che: t('Massa monoisotopica attesa per M⁺', 'Expected monoisotopic mass for M⁺'),
          valore: Math.round(r.massaMono * 100) / 100,
          prova: t('somma delle masse degli isotopi più abbondanti',
                   'sum of the most abundant isotope masses'),
          certezza: t('esatta', 'exact')
        });
      }
    }

    /* ── lo spettro di massa ── */
    var picchi = normalizzaPicchi(d.ms);
    if (picchi.length) {
      r.ms = picchi;
      var maxMz = picchi.reduce(function (a, b) { return b.mz > a.mz ? b : a; });
      var base = picchi.reduce(function (a, b) { return b.i > a.i ? b : a; });
      /* lo ione molecolare: se la formula c'è si cerca alla massa attesa,
         altrimenti si prende il piu' pesante — dicendo che e' un'ipotesi */
      var M = null;
      if (r.massaMono) {
        var atteso = Math.round(r.massaMono);
        M = picchi.filter(function (p) { return Math.abs(p.mz - atteso) < 0.6; })[0] || null;
        if (M) {
          r.deduzioni.push({
            che: t('Lo ione molecolare è coerente con la formula',
                   'The molecular ion matches the formula'),
            valore: 'm/z ' + M.mz,
            prova: t('la formula prevede ', 'the formula predicts ') + atteso,
            certezza: t('verificata', 'verified')
          });
        } else {
          r.avvisi.push(t('nessun picco alla massa attesa (' + atteso +
                          '): la formula e lo spettro non si parlano',
                          'no peak at the expected mass (' + atteso +
                          '): formula and spectrum disagree'));
        }
      }
      if (!M) {
        M = maxMz;
        r.supposizioni.push({
          che: t('Ione molecolare presunto', 'Presumed molecular ion'),
          valore: 'm/z ' + M.mz,
          perche: t('è il più pesante osservato; in EI può non comparire affatto, ' +
                    'e allora il vero M⁺ è più in alto',
                    'it is the heaviest observed; in EI it may not appear at all, ' +
                    'in which case the true M⁺ is higher')
        });
      }
      r.ioneMolecolare = M.mz;
      r.piccoBase = base.mz;

      /* numero di carboni dal M+1 */
      var m1 = picchi.filter(function (p) { return Math.abs(p.mz - M.mz - 1) < 0.6; })[0];
      if (m1 && M.i) {
        var c = carboniDaM1(M.i, m1.i, F ? F.conta : null);
        if (c && isFinite(c.nC)) {
          r.carboniDaM1 = c;
          r.supposizioni.push({
            che: t('Numero di carboni dal picco M+1', 'Carbon count from the M+1 peak'),
            valore: c.nC + ' ± ' + c.margine,
            perche: t('I(M+1)/I(M) = ' + c.rapporto + ' %' +
                      (c.correzione ? (', meno ' + c.correzione + ' % per N/S/Si') : '') +
                      ', diviso 1,1 % per carbonio',
                      'I(M+1)/I(M) = ' + c.rapporto + '%' +
                      (c.correzione ? (', minus ' + c.correzione + '% for N/S/Si') : '') +
                      ', divided by 1.1% per carbon'),
            margine: t('su un M+1 debole basta poco a spostarlo di un carbonio',
                       'on a weak M+1 very little shifts it by one carbon')
          });
          if (F && F.conta.C && Math.abs(F.conta.C - c.nC) > c.margine) {
            r.avvisi.push(t('la stima dal M+1 (' + c.nC + ' C) non concorda con la formula (' +
                            F.conta.C + ' C)',
                            'the M+1 estimate (' + c.nC + ' C) disagrees with the formula (' +
                            F.conta.C + ' C)'));
          }
        }
      }

      /* eteroatomi dal M+2 */
      var m2 = picchi.filter(function (p) { return Math.abs(p.mz - M.mz - 2) < 0.6; })[0];
      if (m2 && M.i) {
        var e = eteroDaM2(M.i, m2.i);
        if (e && e.indizio) {
          r.eteroDaM2 = e;
          r.supposizioni.push({
            che: t('Eteroatomo dal picco M+2', 'Heteroatom from the M+2 peak'),
            valore: e.indizio,
            perche: 'I(M+2)/I(M) = ' + e.rapporto + ' %'
          });
        }
      }

      /* le perdite */
      var perd = perditeFra(picchi).filter(function (p) {
        return Math.abs(p.da - M.mz) < 0.6 || p.intDa >= base.i * 0.4;
      });
      if (perd.length) {
        r.perdite = perd.slice(0, 14);
        r.perdite.forEach(function (p) {
          r.supposizioni.push({
            che: t('Perdita di ', 'Loss of ') + p.frammento,
            valore: p.da + ' → ' + p.a + '  (−' + p.delta + ')',
            perche: p.nota
          });
        });
      }
    }

    /* ── l'infrarosso ── */
    if (d.ir && globale.BSILettoreSpettri && globale.BSILettoreSpettri.assegnaIR) {
      var bande = (typeof d.ir === 'string')
        ? d.ir.split(/[,;\s]+/).map(parseFloat).filter(isFinite)
        : d.ir;
      r.ir = bande.map(function (v) {
        return { cm: v, assegnazioni: globale.BSILettoreSpettri.assegnaIR(v) };
      });
      r.ir.forEach(function (b) {
        if (!b.assegnazioni.length) return;
        r.supposizioni.push({
          che: t('Banda IR a ', 'IR band at ') + b.cm + ' cm⁻¹',
          valore: b.assegnazioni.map(function (a) { return a.legame; }).join(' / '),
          perche: t('compatibile con: ', 'compatible with: ') +
                  b.assegnazioni.map(function (a) { return a.nota; }).join(' · ')
        });
      });
    }

    /* ── il ¹³C ── */
    var c13 = (typeof d.c13 === 'string')
      ? d.c13.split(/[,;\s]+/).map(parseFloat).filter(isFinite)
      : (d.c13 || []);
    if (c13.length) {
      r.c13 = c13.slice().sort(function (a, b) { return b - a; }).map(function (v) {
        return { ppm: v, classi: classiPer(v, INTERVALLI_C) };
      });
      r.deduzioni.push({
        che: t('Segnali ¹³C distinti', 'distinct ¹³C signals'),
        valore: c13.length,
        prova: t('contati nella lista', 'counted in the list'),
        certezza: t('esatta', 'exact'),
        nota: (F && F.conta.C)
          ? (c13.length < F.conta.C
             ? t('meno dei ' + F.conta.C + ' carboni della formula: ci sono carboni ' +
                 'EQUIVALENTI, quindi un elemento di simmetria',
                 'fewer than the ' + F.conta.C + ' carbons in the formula: there are ' +
                 'EQUIVALENT carbons, hence a symmetry element')
             : t('quanti i carboni della formula: nessuna equivalenza',
                 'as many as the formula’s carbons: no equivalence'))
          : ''
      });
    }

    /* ── il ¹H ── */
    var h1 = d.h1;
    if (typeof h1 === 'string') {
      /* righe «ppm integrazione molteplicità», come si trascrivono da uno
         spettro: «9.52 1 d» */
      h1 = h1.split(/\r?\n/).map(function (riga) {
        var p = riga.trim().split(/[,;\t\s]+/).filter(function (x) { return x !== ''; });
        if (!p.length) return null;
        var ppm = parseFloat(p[0]);
        if (!isFinite(ppm)) return null;
        return { ppm: ppm, nH: p.length > 1 ? parseFloat(p[1]) : null,
                 molteplicita: p.length > 2 ? p.slice(2).join(' ') : '' };
      }).filter(Boolean);
    }
    if (h1 && h1.length) {
      r.h1 = h1.slice().sort(function (a, b) { return b.ppm - a.ppm; }).map(function (s) {
        return { ppm: s.ppm, nH: s.nH, molteplicita: s.molteplicita,
                 classi: classiPer(s.ppm, INTERVALLI_H) };
      });
      var tot = 0, noti = 0;
      h1.forEach(function (s) { if (isFinite(s.nH)) { tot += s.nH; noti++; } });
      if (noti === h1.length && tot > 0) {
        r.protoniTotali = tot;
        r.deduzioni.push({
          che: t('Protoni dalle integrazioni', 'Protons from the integrals'),
          valore: tot,
          prova: t('somma delle integrazioni dichiarate', 'sum of the stated integrals'),
          certezza: t('esatta se le integrazioni sono quelle vere; il RAPPORTO è ' +
                      'affidabile, il valore assoluto va ancorato a un segnale noto',
                      'exact if the integrals are the real ones; the RATIO is reliable, ' +
                      'the absolute value needs anchoring to a known signal')
        });
        if (F && F.conta.H && F.conta.H !== tot) {
          r.avvisi.push(t('le integrazioni sommano ' + tot + ' H ma la formula ne ha ' +
                          F.conta.H + ': o un segnale manca (scambiabile?), o il ' +
                          'riferimento dell’integrazione è un altro',
                          'the integrals sum to ' + tot + ' H but the formula has ' +
                          F.conta.H + ': either a signal is missing (exchangeable?), ' +
                          'or the integration reference is different'));
        }
      }
    }

    return r;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §5 · Il confronto con una struttura proposta

     Qui il programma non indovina: prende una proposta, ne prevede gli
     spettri e li mette accanto a quelli osservati. Il punteggio serve a
     confrontare DUE proposte fra loro, non a dire «è giusta».
     ═════════════════════════════════════════════════════════════════════════ */
  function accoppia(previsti, osservati, tolleranza) {
    /* accoppiamento avido: ogni osservato prende il previsto più vicino
       ancora libero. Non è l'accoppiamento ottimo, ed è dichiarato. */
    var liberi = previsti.map(function (p, i) { return { p: p, i: i, usato: false }; });
    var coppie = [], orfaniOss = [];
    osservati.slice().sort(function (a, b) { return a - b; }).forEach(function (o) {
      var best = null, bd = Infinity;
      liberi.forEach(function (x) {
        if (x.usato) return;
        var d = Math.abs(x.p - o);
        if (d < bd) { bd = d; best = x; }
      });
      if (best && bd <= tolleranza) {
        best.usato = true;
        coppie.push({ oss: o, prev: best.p, scarto: Math.round(bd * 100) / 100 });
      } else orfaniOss.push(o);
    });
    return { coppie: coppie, orfaniOsservati: orfaniOss,
             orfaniPrevisti: liberi.filter(function (x) { return !x.usato; })
                                   .map(function (x) { return x.p; }) };
  }

  function confronta(smiles, dati) {
    dati = dati || {};
    if (!globale.BSINMR) return { errore: t('il predittore NMR non è caricato',
                                            'the NMR predictor is not loaded') };
    var esito = { smiles: smiles, parti: [] };

    /* la formula della proposta deve essere quella dichiarata */
    var R = globale.__rdkit;
    if (R && dati.formula) {
      var mol = null;
      try { mol = R.get_mol(String(smiles)); } catch (e) { mol = null; }
      if (!mol) return { errore: t('la struttura proposta non è leggibile',
                                   'the proposed structure is not readable') };
      var g = globale.BSINMR.grafoDa(mol);
      var conta = {};
      g.atomi.forEach(function (a) {
        conta[a.sim] = (conta[a.sim] || 0) + 1;
        if (a.h) conta.H = (conta.H || 0) + a.h;
      });
      try { mol.delete(); } catch (e) {}
      var F = leggiFormula(dati.formula);
      if (F) {
        var uguale = Object.keys(F.conta).every(function (e) { return conta[e] === F.conta[e]; }) &&
                     Object.keys(conta).every(function (e) { return F.conta[e] === conta[e]; });
        esito.formulaCoincide = uguale;
        esito.formulaProposta = conta;
        esito.parti.push({
          nome: t('Formula molecolare', 'Molecular formula'),
          esito: uguale, peso: 3,
          dettaglio: uguale
            ? t('la proposta ha esattamente la formula dichiarata',
                'the proposal has exactly the stated formula')
            : t('la proposta NON ha la formula dichiarata: qualunque altro accordo ' +
                'è una coincidenza',
                'the proposal does NOT have the stated formula: any other agreement ' +
                'is a coincidence')
        });
      }
    }

    /* ¹³C */
    var c13 = (typeof dati.c13 === 'string')
      ? dati.c13.split(/[,;\s]+/).map(parseFloat).filter(isFinite)
      : (dati.c13 || []);
    if (c13.length) {
      var p13 = globale.BSINMR.predici(smiles, { nucleo: '13C' });
      if (p13 && !p13.errore) {
        var prev = p13.segnali.map(function (s) { return s.ppm; });
        /* Tolleranza 5 ppm e non 8: lo scarto misurato del predittore e'
           ~1 ppm sugli aromatici e ~3 sugli sp3. Con 8 un carbonio qualunque
           trovava un partner per caso, e una struttura sbagliata accoppiava
           tutto. */
        var a = accoppia(prev, c13, 5);
        esito.c13 = { coppie: a.coppie, orfaniOsservati: a.orfaniOsservati,
                      orfaniPrevisti: a.orfaniPrevisti,
                      nPrevisti: prev.length, nOsservati: c13.length };
        var scartoMedio = a.coppie.length
          ? a.coppie.reduce(function (s, c) { return s + c.scarto; }, 0) / a.coppie.length
          : null;
        esito.c13.scartoMedio = scartoMedio === null ? null : Math.round(scartoMedio * 100) / 100;
        esito.parti.push({
          nome: t('Numero di segnali ¹³C', 'Number of ¹³C signals'),
          esito: prev.length === c13.length, peso: 2,
          dettaglio: t('previsti ' + prev.length + ', osservati ' + c13.length,
                       'predicted ' + prev.length + ', observed ' + c13.length)
        });
        /* Un segnale OSSERVATO senza corrispondenza e' la prova piu' forte
           contro una proposta: significa che la struttura non ha nessun
           carbonio che possa dare quello spostamento. Senza questo peso, due
           proposte — una con cinque segnali orfani e una con quattro —
           uscivano con lo STESSO punteggio, e il confronto non serviva a
           niente. */
        esito.parti.push({
          nome: t('Ogni segnale ¹³C osservato trova un carbonio',
                  'Every observed ¹³C signal finds a carbon'),
          esito: a.orfaniOsservati.length === 0, peso: 3,
          dettaglio: a.orfaniOsservati.length === 0
            ? t('tutti accoppiati', 'all matched')
            : t('senza corrispondenza: ' + a.orfaniOsservati.join(', ') + ' ppm',
                'unmatched: ' + a.orfaniOsservati.join(', ') + ' ppm')
        });
        esito.parti.push({
          nome: t('Accordo degli spostamenti ¹³C', '¹³C shift agreement'),
          esito: a.orfaniOsservati.length === 0 && scartoMedio !== null && scartoMedio < 5,
          peso: 2,
          dettaglio: t('scarto medio ' + (scartoMedio === null ? '—' : scartoMedio.toFixed(2)) +
                       ' ppm · segnali osservati senza corrispondenza: ' + a.orfaniOsservati.length,
                       'mean deviation ' + (scartoMedio === null ? '—' : scartoMedio.toFixed(2)) +
                       ' ppm · observed signals unmatched: ' + a.orfaniOsservati.length)
        });
      }
    }

    /* ¹H */
    var h1 = dati.h1;
    if (typeof h1 === 'string') {
      h1 = h1.split(/\r?\n/).map(function (riga) {
        var p = riga.trim().split(/[,;\t\s]+/).filter(function (x) { return x !== ''; });
        var ppm = parseFloat(p[0]);
        return isFinite(ppm) ? { ppm: ppm, nH: p.length > 1 ? parseFloat(p[1]) : null } : null;
      }).filter(Boolean);
    }
    if (h1 && h1.length) {
      var pH = globale.BSINMR.predici(smiles, { nucleo: '1H' });
      if (pH && !pH.errore) {
        var prevH = pH.segnali.map(function (s) { return s.ppm; });
        var aH = accoppia(prevH, h1.map(function (s) { return s.ppm; }), 0.8);
        var scH = aH.coppie.length
          ? aH.coppie.reduce(function (s, c) { return s + c.scarto; }, 0) / aH.coppie.length
          : null;
        esito.h1 = { coppie: aH.coppie, orfaniOsservati: aH.orfaniOsservati,
                     scartoMedio: scH === null ? null : Math.round(scH * 100) / 100,
                     nPrevisti: prevH.length, nOsservati: h1.length,
                     protoniPrevisti: pH.segnali.reduce(function (s, x) { return s + (x.nH || 0); }, 0) };
        esito.parti.push({
          nome: t('Accordo degli spostamenti ¹H', '¹H shift agreement'),
          esito: aH.orfaniOsservati.length <= 1 && scH !== null && scH < 0.6, peso: 2,
          dettaglio: t('scarto medio ' + (scH === null ? '—' : scH.toFixed(2)) +
                       ' ppm · senza corrispondenza: ' + aH.orfaniOsservati.length,
                       'mean deviation ' + (scH === null ? '—' : scH.toFixed(2)) +
                       ' ppm · unmatched: ' + aH.orfaniOsservati.length)
        });
      }
    }

    /* ── Quanto ci si puo' fidare del punteggio ───────────────────────────
       Un punteggio basso puo' voler dire due cose MOLTO diverse: che la
       struttura e' sbagliata, oppure che il predittore non sa descriverla.
       Confonderle sarebbe il difetto peggiore di uno strumento come questo,
       perche' farebbe scartare la risposta giusta.

       Il predittore e' stato misurato: ~1 ppm sugli aromatici benzenoidi,
       ~3 sugli sp3. Sugli ETEROAROMATICI SOSTITUITI non ha incrementi di
       posizione — esistono per il benzene, non li ho per furano, tiofene,
       pirrolo e piridina — e li' sbaglia di parecchio: sul 2-furilacrilico
       del quesito A lascia quattro segnali senza corrispondenza pur essendo
       la struttura GIUSTA. Quando la proposta contiene quel motivo, il
       punteggio va letto con sospetto, e lo strumento lo dice. */
    var fiducia = 'alta', perche = [];
    if (globale.__rdkit) {
      var mm = null;
      try { mm = globale.__rdkit.get_mol(String(smiles)); } catch (e) { mm = null; }
      if (mm) {
        var q = null, eteroSost = false;
        try {
          q = globale.__rdkit.get_qmol('[c;r5,r6;$(c:[o,s,nX2,nX3H1])]!@[!#1]');
          var mt = mm.get_substruct_matches(q);
          eteroSost = !!(mt && mt !== '{}' && JSON.parse(mt).length);
        } catch (e) { eteroSost = false; }
        if (q) { try { q.delete(); } catch (e) {} }
        try { mm.delete(); } catch (e) {}
        if (eteroSost) {
          fiducia = 'bassa';
          perche.push(t('la struttura contiene un eteroaromatico SOSTITUITO, e per ' +
                        'quelli il predittore non ha incrementi di posizione: pu\u00f2 ' +
                        'sbagliare di 8-10 ppm sui carboni dell\u2019anello',
                        'the structure contains a SUBSTITUTED heteroaromatic, for which ' +
                        'the predictor has no positional increments: it can be off by ' +
                        '8-10 ppm on the ring carbons'));
        }
      }
    }
    esito.fiducia = fiducia;
    esito.perche = perche;

    var pesoTot = 0, pesoOk = 0;
    esito.parti.forEach(function (p) {
      pesoTot += p.peso;
      if (p.esito) pesoOk += p.peso;
    });
    esito.punteggio = pesoTot ? Math.round(pesoOk / pesoTot * 100) : null;
    esito.avvertenza = t(
      'Il punteggio serve a confrontare DUE proposte fra loro. Non dice che una ' +
      'struttura è giusta: dice quanto bene regge ai dati che le hai dato. E un ' +
      'punteggio basso può voler dire che la struttura è sbagliata OPPURE che il ' +
      'predittore non sa descriverla: guarda la fiducia.',
      'The score is for comparing TWO proposals with each other. It does not say a ' +
      'structure is right: it says how well it stands up to the data you gave it. And ' +
      'a low score can mean the structure is wrong OR that the predictor cannot ' +
      'describe it: check the confidence.');
    return esito;
  }

  globale.BSIElucida = {
    dossier: dossier, confronta: confronta,
    leggiFormula: leggiFormula, insaturazioni: insaturazioni,
    carboniDaM1: carboniDaM1, eteroDaM2: eteroDaM2, perditeFra: perditeFra,
    classiPer: classiPer, accoppia: accoppia,
    massaDa: massaDa, MONO: MONO, MASSA: MASSA,
    INTERVALLI_C: INTERVALLI_C, INTERVALLI_H: INTERVALLI_H, PERDITE: PERDITE,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);

/* ═══════════════════════════════════════════════════════════════════════════
   §6 · Il pannello — dentro «Lettore spettri»

   Non è una sezione nuova: il Lettore spettri è già il posto dove si portano i
   propri dati, e l'elucidazione è quello che si fa con quei dati una volta
   letti. Una sezione a parte avrebbe significato due posti per lo stesso
   gesto — e questo progetto ha una regola contro i doppioni.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var E = globale.BSIElucida;
  if (!E) return;

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var CSS = [
    '.bsiEL-card{background:#0a1628;border:1px solid #16293f;border-radius:12px;padding:13px;margin-top:12px}',
    '.bsiEL-card h4{margin:0 0 8px;font-family:var(--font-mono,ui-monospace,monospace);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7bf3c4}',
    '.bsiEL-gr{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:9px}',
    '.bsiEL-in{width:100%;padding:8px 10px;background:#060d1a;border:1px solid #1d3450;border-radius:8px;color:#e9eef6;font-family:var(--font-mono,ui-monospace,monospace);font-size:12px}',
    '.bsiEL-lb{display:block;font-size:11px;color:#8aadcc;margin-bottom:3px}',
    '.bsiEL-b{padding:7px 14px;background:#00c896;border:none;border-radius:8px;color:#04221a;font-weight:800;cursor:pointer;font-family:var(--font-mono,ui-monospace,monospace);font-size:12px}',
    '.bsiEL-b2{padding:7px 12px;background:#0f2040;border:1px solid #1d3450;border-radius:8px;color:#cfe2f5;cursor:pointer;font-family:var(--font-mono,ui-monospace,monospace);font-size:11.5px}',
    '.bsiEL-ded{border-left:3px solid #00c896;padding:6px 10px;margin:6px 0;background:#0c1c30;border-radius:0 8px 8px 0}',
    '.bsiEL-sup{border-left:3px solid #ffd93d;padding:6px 10px;margin:6px 0;background:#0c1c30;border-radius:0 8px 8px 0}',
    '.bsiEL-avv{border-left:3px solid #ff6b6b;padding:6px 10px;margin:6px 0;background:#1a0f14;border-radius:0 8px 8px 0;color:#ffc9c9;font-size:12px}',
    '.bsiEL-ded b,.bsiEL-sup b{color:#e9eef6;font-size:12.5px}',
    '.bsiEL-ded .v{color:#7bf3c4;font-weight:800}',
    '.bsiEL-sup .v{color:#ffd93d;font-weight:800}',
    '.bsiEL-ded .p,.bsiEL-sup .p{display:block;font-size:11px;color:#8aadcc;line-height:1.5;margin-top:2px}',
    '.bsiEL-tbl{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px}',
    '.bsiEL-tbl th{background:#15354a;color:#bff3e4;padding:5px 7px;text-align:left;font-size:10.5px}',
    '.bsiEL-tbl td{padding:4px 7px;border-bottom:1px solid #16293f;color:#cfe2f5}',
    '.bsiEL-no{color:#ff6b6b}', '.bsiEL-si{color:#7bf3c4}'
  ].join('');

  function stile() {
    if (document.getElementById('bsiEL-css')) return;
    var s = document.createElement('style');
    s.id = 'bsiEL-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function vista() {
    return '<div class="bsiEL-card"><h4>' +
      t('🧩 Elucidazione — dai dati alla struttura',
        '🧩 Elucidation — from the data to the structure') + '</h4>' +
      '<p style="font-size:11.5px;color:#8aadcc;line-height:1.55;margin:0 0 10px">' + t(
      'Incolla quello che hai: la formula molecolare, la lista dei picchi di massa, ' +
      'le bande IR, i segnali ¹³C e ¹H. Esce un <b>dossier</b> in cui le <b>deduzioni</b> ' +
      '(esatte, aritmetiche) stanno separate dalle <b>supposizioni</b> (plausibili, con ' +
      'il loro margine). <b>Non propone una struttura</b>: dedurla da zero è un problema ' +
      'di ricerca, e un programma che ne sputasse una sola darebbe una certezza che i ' +
      'dati non contengono. Quello che fa è <b>verificare una proposta</b>, segnale per ' +
      'segnale, dicendo dove casca.',
      'Paste what you have: the molecular formula, the mass peak list, the IR bands, the ' +
      '¹³C and ¹H signals. Out comes a <b>dossier</b> in which <b>deductions</b> (exact, ' +
      'arithmetic) are kept apart from <b>guesses</b> (plausible, with their margin). ' +
      '<b>It does not propose a structure</b>: deriving one from scratch is a research ' +
      'problem, and a program that produced a single answer would give a certainty the ' +
      'data do not contain. What it does is <b>check a proposal</b>, signal by signal, ' +
      'saying where it falls down.') + '</p>' +
      '<div class="bsiEL-gr">' +
      '<div><label class="bsiEL-lb" for="bsiEL-f">' + t('formula molecolare', 'molecular formula') +
        '</label><input class="bsiEL-in" id="bsiEL-f" placeholder="C9H10O2S"></div>' +
      '<div><label class="bsiEL-lb" for="bsiEL-ir">' + t('bande IR (cm⁻¹)', 'IR bands (cm⁻¹)') +
        '</label><input class="bsiEL-in" id="bsiEL-ir" placeholder="1680 1600 1250"></div>' +
      '</div>' +
      '<div class="bsiEL-gr" style="margin-top:8px">' +
      '<div><label class="bsiEL-lb" for="bsiEL-ms">' + t('picchi di massa «m/z intensità»', 'mass peaks "m/z intensity"') +
        '</label><textarea class="bsiEL-in" id="bsiEL-ms" rows="4" spellcheck="false" placeholder="182 78&#10;135 100&#10;107 28.3"></textarea></div>' +
      '<div><label class="bsiEL-lb" for="bsiEL-c13">' + t('segnali ¹³C (ppm)', '¹³C signals (ppm)') +
        '</label><textarea class="bsiEL-in" id="bsiEL-c13" rows="4" spellcheck="false" placeholder="192.04 150.77 146.05 …"></textarea></div>' +
      '<div><label class="bsiEL-lb" for="bsiEL-h1">' + t('segnali ¹H «ppm integrazione molteplicità»', '¹H signals "ppm integral multiplicity"') +
        '</label><textarea class="bsiEL-in" id="bsiEL-h1" rows="4" spellcheck="false" placeholder="9.52 1 d&#10;7.04 1 d&#10;2.09 3 s"></textarea></div>' +
      '</div>' +
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
      '<button class="bsiEL-b" id="bsiEL-go">' + t('Deduci', 'Deduce') + '</button>' +
      '<input class="bsiEL-in" id="bsiEL-smi" style="flex:1;min-width:170px" placeholder="' +
        t('SMILES di una struttura da verificare', 'SMILES of a structure to check') + '">' +
      '<button class="bsiEL-b2" id="bsiEL-ver">' + t('Verifica', 'Check') + '</button>' +
      '<button class="bsiEL-b2" data-elEs="A">' + t('esempio d’esame', 'exam example') + '</button>' +
      '</div><div id="bsiEL-out"></div></div>';
  }

  function rendiDossier(d) {
    var h = '';
    if (d.avvisi && d.avvisi.length) {
      d.avvisi.forEach(function (a) {
        h += '<div class="bsiEL-avv">⚠ ' + esc(a) + '</div>';
      });
    }
    if (d.deduzioni && d.deduzioni.length) {
      h += '<h4 style="margin-top:12px">' + t('Quello che i dati IMPONGONO',
                                              'What the data REQUIRE') + '</h4>';
      d.deduzioni.forEach(function (x) {
        h += '<div class="bsiEL-ded"><b>' + esc(x.che) + ':</b> <span class="v">' +
          esc(x.valore) + '</span><span class="p">' + esc(x.prova) +
          ' — <i>' + esc(x.certezza) + '</i>' +
          (x.nota ? ('<br>' + esc(x.nota)) : '') + '</span></div>';
      });
    }
    if (d.supposizioni && d.supposizioni.length) {
      h += '<h4 style="margin-top:12px">' + t('Quello che SUGGERISCONO',
                                              'What they SUGGEST') + '</h4>';
      d.supposizioni.forEach(function (x) {
        h += '<div class="bsiEL-sup"><b>' + esc(x.che) + ':</b> <span class="v">' +
          esc(x.valore) + '</span><span class="p">' + esc(x.perche) +
          (x.margine ? ('<br><i>' + esc(x.margine) + '</i>') : '') + '</span></div>';
      });
    }
    if (d.c13 && d.c13.length) {
      h += '<h4 style="margin-top:12px">' + t('Che cosa può essere ogni segnale ¹³C',
                                              'What each ¹³C signal can be') + '</h4>' +
        '<table class="bsiEL-tbl"><tr><th>ppm</th><th>' +
        t('compatibile con', 'compatible with') + '</th></tr>';
      d.c13.forEach(function (c) {
        h += '<tr><td><b>' + c.ppm + '</b></td><td>' +
          (c.classi.length ? esc(c.classi.join(' · ')) :
           '<span class="bsiEL-no">' + t('fuori da ogni intervallo noto',
                                         'outside every known range') + '</span>') + '</td></tr>';
      });
      h += '</table>';
    }
    if (d.h1 && d.h1.length) {
      h += '<h4 style="margin-top:12px">' + t('Che cosa può essere ogni segnale ¹H',
                                              'What each ¹H signal can be') + '</h4>' +
        '<table class="bsiEL-tbl"><tr><th>ppm</th><th>H</th><th>' +
        t('mult.', 'mult.') + '</th><th>' + t('compatibile con', 'compatible with') +
        '</th></tr>';
      d.h1.forEach(function (c) {
        h += '<tr><td><b>' + c.ppm + '</b></td><td>' + (c.nH == null ? '—' : c.nH) +
          '</td><td>' + esc(c.molteplicita || '') + '</td><td>' +
          esc(c.classi.join(' · ')) + '</td></tr>';
      });
      h += '</table>';
    }
    return h;
  }

  function rendiConfronto(c) {
    if (c.errore) return '<div class="bsiEL-avv">⚠ ' + esc(c.errore) + '</div>';
    var h = '<h4 style="margin-top:12px">' + t('La proposta messa alla prova',
                                               'The proposal put to the test') + '</h4>';
    h += '<div class="bsiEL-ded"><b>' + t('Punteggio', 'Score') + ':</b> <span class="v">' +
      c.punteggio + ' / 100</span> · <b>' + t('fiducia', 'confidence') + ':</b> ' +
      '<span class="' + (c.fiducia === 'bassa' ? 'bsiEL-no' : 'bsiEL-si') + '">' +
      esc(c.fiducia) + '</span><span class="p">' + esc(c.avvertenza) +
      ((c.perche && c.perche.length)
        ? ('<br>⚠ ' + c.perche.map(esc).join('<br>⚠ ')) : '') + '</span></div>';
    h += '<table class="bsiEL-tbl"><tr><th>' + t('prova', 'test') + '</th><th>' +
      t('esito', 'result') + '</th><th>' + t('dettaglio', 'detail') + '</th></tr>';
    (c.parti || []).forEach(function (p) {
      h += '<tr><td>' + esc(p.nome) + '</td><td class="' +
        (p.esito ? 'bsiEL-si' : 'bsiEL-no') + '">' + (p.esito ? '✓' : '✗') +
        '</td><td>' + esc(p.dettaglio) + '</td></tr>';
    });
    h += '</table>';
    if (c.c13 && c.c13.coppie) {
      h += '<h4 style="margin-top:10px">' + t('¹³C, segnale per segnale',
                                              '¹³C, signal by signal') + '</h4>' +
        '<table class="bsiEL-tbl"><tr><th>' + t('osservato', 'observed') + '</th><th>' +
        t('previsto', 'predicted') + '</th><th>' + t('scarto', 'deviation') + '</th></tr>';
      c.c13.coppie.forEach(function (x) {
        h += '<tr><td>' + x.oss + '</td><td>' + x.prev + '</td><td>' + x.scarto + '</td></tr>';
      });
      (c.c13.orfaniOsservati || []).forEach(function (o) {
        h += '<tr><td>' + o + '</td><td class="bsiEL-no">' +
          t('nessun carbonio', 'no carbon') + '</td><td class="bsiEL-no">—</td></tr>';
      });
      h += '</table>';
    }
    return h;
  }

  function dati() {
    function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
    return { formula: v('bsiEL-f'), ms: v('bsiEL-ms'), ir: v('bsiEL-ir'),
             c13: v('bsiEL-c13'), h1: v('bsiEL-h1') };
  }

  function aggancia() {
    var out = document.getElementById('bsiEL-out');
    if (!out) return;
    var go = document.getElementById('bsiEL-go');
    if (go) go.onclick = function () { out.innerHTML = rendiDossier(E.dossier(dati())); };
    var ver = document.getElementById('bsiEL-ver');
    if (ver) ver.onclick = function () {
      var s = document.getElementById('bsiEL-smi');
      if (!s || !s.value.trim()) return;
      var d = dati();
      out.innerHTML = rendiConfronto(E.confronta(s.value.trim(), d)) + rendiDossier(E.dossier(d));
    };
    [].forEach.call(document.querySelectorAll('[data-elEs]'), function (b) {
      b.onclick = function () {
        document.getElementById('bsiEL-f').value = 'C9H10O2S';
        document.getElementById('bsiEL-ms').value =
          '182 78\n181 10\n135 100\n134 48.8\n107 28.3\n106 65.1\n79 74.9\n77 83.3';
        document.getElementById('bsiEL-ir').value = '1680 1600 1250 1015';
        document.getElementById('bsiEL-c13').value =
          '192.04 150.77 146.05 135.55 135.05 118.55 112.97 26.67 15.72';
        document.getElementById('bsiEL-h1').value =
          '9.52 1 d\n7.65 1 s\n7.04 1 d\n6.59 1 d\n6.43 1 dd\n3.76 2 s\n2.09 3 s';
        document.getElementById('bsiEL-smi').value = 'O=CC(=Cc1ccco1)CSC';
        if (go) go.click();
      };
    });
  }

  function monta() {
    var sec = document.getElementById('sspettrolettore');
    if (!sec || !sec.children.length) return;
    if (sec.querySelector('#bsiEL-out')) return;
    stile();
    var d = document.createElement('div');
    d.innerHTML = vista();
    sec.appendChild(d.firstChild);
    aggancia();
  }

  globale.BSIElucidaPannello = { monta: monta, dati: dati };

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.nav-btn[data-s], .bsiMenu-sp') : null;
    if (!b) return;
    var sid = b.getAttribute('data-s') || b.getAttribute('data-bsi-sez');
    if (sid === 'sspettrolettore') setTimeout(monta, 220);
  }, true);

  document.addEventListener('bsi-lingua', function () {
    var sec = document.getElementById('sspettrolettore');
    var v = sec && sec.querySelector('#bsiEL-out');
    if (v) { v.closest('.bsiEL-card').remove(); monta(); }
  });

})(typeof window !== 'undefined' ? window : globalThis);
