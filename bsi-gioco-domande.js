/* ═══════════════════════════════════════════════════════════════════════════
   bsi-gioco-domande — le domande del gioco, GENERATE dai dati dell'app

   LA DECISIONE CHE SPIEGA TUTTO IL FILE

   Qui non c'e' una sola domanda scritta a mano, e non c'e' una sola risposta
   scritta a mano. Ci sono GENERATORI: ognuno pesca da una tabella che
   l'applicazione ha gia' — gli elementi, le tabelle spettroscopiche, le
   reazioni, le strategie di retrosintesi, gli amminoacidi — e costruisce la
   domanda, la risposta e i distrattori da quella.

   Il motivo non e' pigrizia: un elenco di domande scritto a mano sarebbe una
   SECONDA fonte di verita' chimica accanto a quelle che ci sono, e due fonti
   divergono. E' esattamente il difetto che in questo progetto si e' presentato
   due volte — le costanti J in due tabelle con numeri diversi, le bande IR in
   due tabelle con intervalli diversi. Una domanda sbagliata in un gioco
   didattico insegna la cosa sbagliata, e nessuno se ne accorge.

   Cosi' invece: se la tabella e' giusta, la domanda e' giusta. Se la tabella
   cambia, la domanda cambia con lei. E ogni domanda porta la sua PROVENIENZA,
   mostrata dopo la risposta: chi gioca vede da dove viene il dato.

   SE UNA FONTE NON C'E', IL GENERATORE NON GIRA

   Niente ripieghi inventati: un generatore dichiara le fonti che gli servono
   e, se mancano, si tira indietro. `disponibili()` dice quali girano e quali
   no, e il banco lo pretende invece di scoprirlo in partita.

   LA DIFFICOLTA' NON E' UN MOLTIPLICATORE

   Ogni generatore dichiara il suo livello da 1 a 5. La difficolta' scelta non
   rende le stesse domande «piu' difficili» — cambia QUALI domande arrivano:
   a «soluzione diluita» il simbolo di un elemento, a «fusione nucleare» la
   disconnessione retrosintetica giusta per un bersaglio.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* ── un generatore di numeri casuali con seme ─────────────────────────
     Serve per poter RIPETERE una partita: a parita' di seme, le stesse
     domande nello stesso ordine. Un banco non puo' verificare niente su
     qualcosa che cambia a ogni esecuzione. */
  function Caso(seme) {
    var s = (seme || 1) >>> 0;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function scegli(caso, lista) { return lista[Math.floor(caso() * lista.length) % lista.length]; }
  function mescola(caso, lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(caso() * (i + 1));
      var x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }
  /* ── GLI INTERVALLI SI SOVRAPPONGONO, E UNA DOMANDA NON PUO' AVERE DUE
        RISPOSTE GIUSTE ────────────────────────────────────────────────────
     Le tabelle spettroscopiche danno intervalli, e gli intervalli di gruppi
     diversi si accavallano: nella tabella delle costanti J, «⁴J meta» sta a
     1–3 Hz e «⁴J allilico» a 0–3 Hz. Pescando i distrattori a caso dalla
     stessa tabella, la prima stesura ha prodotto «Una costante J di 1–3 Hz
     corrisponde a:» con fra le opzioni ENTRAMBI — due risposte defendibili,
     e quella marcata sbagliata non lo era.
     In un gioco didattico questo non e' un fastidio: insegna la cosa
     sbagliata, e chi gioca non ha modo di accorgersene. Quindi i distrattori
     di una domanda su intervalli devono essere DISGIUNTI dalla risposta: si
     leggono i due numeri e si controlla. Se non ne restano abbastanza, il
     generatore rinuncia e ne gira un altro. */
  /* IL TRATTINO FA DUE MESTIERI, E LA PRIMA STESURA LI HA CONFUSI.
     In «1–3 Hz» il tratto separa due numeri; in «−12 a −15» e' il segno. La
     prima versione convertiva ogni lineetta in «-» e poi cercava `-?\d+`:
     «1-3» diventava i numeri 1 e −3, quindi l'intervallo [−3, 1] — sbagliato
     di segno E di estremi. La conseguenza non era un numero storto in uno
     spiegone: era che NIENTE risultava disgiunto, quindi i quattro
     generatori su intervalli (IR, ¹H, ¹³C, J) non riuscivano mai a trovare
     tre distrattori e si tiravano indietro sempre. Il controllo «zero
     domande ambigue» passava perche' quelle domande non arrivavano piu'.
     Un controllo che passa perche' non misura niente e' peggio di uno che
     falla.
     Qui il segno si riconosce dal CONTESTO: un «-» preceduto da una cifra
     separa, un «-» a inizio numero e' un segno. Il meno tipografico (−) e'
     sempre un segno. */
  function intervallo(s) {
    if (s == null) return null;
    var testo = String(s).replace(/\u2212/g, '~');   /* meno tipografico = segno */
    var v = [], re = /(~?)(\d+(?:[.,]\d+)?)/g, m;
    while ((m = re.exec(testo)) !== null) {
      var segno = 1;
      if (m[1] === '~') segno = -1;
      else {
        /* un «-» o un «–» subito prima, e NON preceduto da una cifra, è segno */
        var i = m.index - 1;
        while (i >= 0 && testo[i] === ' ') i--;
        if (i >= 0 && (testo[i] === '-' || testo[i] === '\u2013' || testo[i] === '\u2014')) {
          var j = i - 1;
          while (j >= 0 && testo[j] === ' ') j--;
          if (j < 0 || !/\d/.test(testo[j])) segno = -1;
        }
      }
      var x = parseFloat(m[2].replace(',', '.'));
      if (isFinite(x)) v.push(segno * x);
    }
    if (!v.length) return null;
    return [Math.min.apply(null, v), Math.max.apply(null, v)];
  }

  function siSovrappongono(a, b) {
    var x = intervallo(a), y = intervallo(b);
    /* se uno dei due non si legge come intervallo, non si puo' affermare che
       siano disgiunti: si considera sovrapposto, cioe' si scarta. Meglio una
       domanda in meno che una domanda con due risposte. */
    if (!x || !y) return true;
    return !(x[1] < y[0] || y[1] < x[0]);
  }

  /* distrattori con intervalli DISGIUNTI da quello della risposta */
  function distrattoriDisgiunti(caso, pool, giusta, n, campo, chiave) {
    var k = chiave || function (x) { return String(x); };
    var buoni = pool.filter(function (y) {
      return k(y) !== k(giusta) && !siSovrappongono(y[campo], giusta[campo]);
    });
    if (buoni.length < n) return null;
    return mescola(caso, buoni).slice(0, n);
  }

  /* n distrattori diversi dalla risposta e diversi fra loro */
  function distrattori(caso, pool, giusta, n, chiave) {
    var k = chiave || function (x) { return String(x); };
    var visti = {}; visti[k(giusta)] = 1;
    var out = [], tentativi = 0;
    while (out.length < n && tentativi < 400) {
      tentativi++;
      var c = scegli(caso, pool);
      var kk = k(c);
      if (visti[kk]) continue;
      visti[kk] = 1; out.push(c);
    }
    return out;
  }

  /* ── le fonti: si leggono dall'applicazione, non si copiano ──────────── */
  function fonte(nome) {
    try {
      switch (nome) {
        case 'ELEMENTS': return (typeof globale.ELEMENTS !== 'undefined') ? globale.ELEMENTS : null;
        case 'SPEC_DATA': return (typeof globale.SPEC_DATA !== 'undefined') ? globale.SPEC_DATA : null;
        case 'RXN': return (typeof globale.RXN !== 'undefined') ? globale.RXN : null;
        case 'RETRO': return (typeof globale.RETRO_STRATEGIES !== 'undefined') ? globale.RETRO_STRATEGIES : null;
        case 'AA': return (typeof globale.AA_DATA !== 'undefined') ? globale.AA_DATA : null;
        case 'ELUCIDA': return globale.BSIElucida || null;
        case 'LETTORE': return globale.BSILettoreSpettri || null;
        default: return null;
      }
    } catch (e) { return null; }
  }
  function ci(nomi) { return nomi.every(function (n) { return !!fonte(n); }); }

  /* gli indici dell'array di un elemento in `ELEMENTS`, misurati sui dati:
     [Z, simbolo, nome, massa, periodo, gruppo, categoria, ossidazione,
      configurazione, elettronegativita, raggio, ionizzazione, fusione, nota] */
  var E = { Z: 0, SIM: 1, NOME: 2, MASSA: 3, PER: 4, GR: 5, CAT: 6, OSS: 7,
            CONF: 8, EN: 9, RAG: 10, ION: 11, FUS: 12, NOTA: 13 };

  var CATEGORIE = {
    0: t('non metallo reattivo', 'reactive non-metal'),
    1: t('metallo alcalino', 'alkali metal'),
    2: t('metallo alcalino terroso', 'alkaline earth metal'),
    3: t('metallo di transizione', 'transition metal'),
    4: t('metallo del blocco p', 'post-transition metal'),
    5: t('semimetallo', 'metalloid'),
    6: t('non metallo', 'non-metal'),
    7: t('alogeno', 'halogen'),
    8: t('gas nobile', 'noble gas'),
    9: t('lantanide', 'lanthanide'),
    10: t('attinide', 'actinide')
  };

  /* ═════════════════════════════════════════════════════════════════════════
     I GENERATORI

     Ognuno: `id`, `liv` (1..5), `serve` (le fonti), `area` (per dire a chi
     gioca di che si tratta), e `fai(caso)` che restituisce
       { domanda, opzioni[], giusta, spiega, provenienza }
     oppure `null` se con quei dati non riesce a costruire una domanda sensata.
     ═════════════════════════════════════════════════════════════════════════ */
  var GEN = [

    /* ── gli elementi ─────────────────────────────────────────────────── */
    { id: 'simbolo-da-nome', liv: 1, serve: ['ELEMENTS'],
      area: t('tavola periodica', 'periodic table'),
      fai: function (caso) {
        var el = fonte('ELEMENTS');
        var x = scegli(caso, el);
        var d = distrattori(caso, el, x, 3, function (y) { return y[E.SIM]; });
        return {
          domanda: t('Qual è il simbolo di ', 'What is the symbol of ') + x[E.NOME] + '?',
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y[E.SIM]; }),
          giusta: x[E.SIM],
          spiega: x[E.NOME] + ' = ' + x[E.SIM] + ' · Z = ' + x[E.Z],
          provenienza: 'ELEMENTS'
        };
      } },

    { id: 'nome-da-simbolo', liv: 1, serve: ['ELEMENTS'],
      area: t('tavola periodica', 'periodic table'),
      fai: function (caso) {
        var el = fonte('ELEMENTS');
        var x = scegli(caso, el);
        var d = distrattori(caso, el, x, 3, function (y) { return y[E.NOME]; });
        return {
          domanda: t('Che elemento è ', 'Which element is ') + x[E.SIM] + '?',
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y[E.NOME]; }),
          giusta: x[E.NOME],
          spiega: x[E.SIM] + ' = ' + x[E.NOME] + ' · ' + (x[E.NOTA] || '').slice(0, 110),
          provenienza: 'ELEMENTS'
        };
      } },

    { id: 'categoria', liv: 2, serve: ['ELEMENTS'],
      area: t('tavola periodica', 'periodic table'),
      fai: function (caso) {
        var el = fonte('ELEMENTS').filter(function (y) { return CATEGORIE[y[E.CAT]]; });
        if (el.length < 6) return null;
        var x = scegli(caso, el);
        var giusta = CATEGORIE[x[E.CAT]];
        var altre = Object.keys(CATEGORIE).map(function (k) { return CATEGORIE[k]; })
          .filter(function (c) { return c !== giusta; });
        return {
          domanda: t('A che famiglia appartiene ', 'Which family does ') + x[E.NOME] +
                   t('?', ' belong to?'),
          opzioni: mescola(caso, [giusta].concat(mescola(caso, altre).slice(0, 3))),
          giusta: giusta,
          spiega: x[E.NOME] + ' · ' + t('periodo ', 'period ') + x[E.PER] +
                  ', ' + t('gruppo ', 'group ') + x[E.GR],
          provenienza: 'ELEMENTS'
        };
      } },

    { id: 'numero-atomico', liv: 2, serve: ['ELEMENTS'],
      area: t('tavola periodica', 'periodic table'),
      fai: function (caso) {
        var el = fonte('ELEMENTS');
        var x = scegli(caso, el);
        var d = distrattori(caso, el, x, 3, function (y) { return String(y[E.Z]); });
        return {
          domanda: t('Quanti protoni ha ', 'How many protons does ') + x[E.NOME] +
                   t('?', ' have?'),
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return String(y[E.Z]); }),
          giusta: String(x[E.Z]),
          spiega: t('Il numero atomico Z è il numero di protoni: ',
                    'The atomic number Z is the proton count: ') + x[E.NOME] + ' → Z = ' + x[E.Z],
          provenienza: 'ELEMENTS'
        };
      } },

    { id: 'elettronegativita', liv: 3, serve: ['ELEMENTS'],
      area: t('periodicità', 'periodicity'),
      fai: function (caso) {
        var el = fonte('ELEMENTS').filter(function (y) {
          return typeof y[E.EN] === 'number' && y[E.EN] > 0; });
        if (el.length < 4) return null;
        var q = mescola(caso, el).slice(0, 4);
        /* la risposta e' CALCOLATA dai dati, non scelta da me */
        var vinc = q.reduce(function (m, y) { return (!m || y[E.EN] > m[E.EN]) ? y : m; }, null);
        /* due elementi con la stessa elettronegativita' renderebbero la
           domanda senza risposta unica: in quel caso si rinuncia */
        if (q.filter(function (y) { return y[E.EN] === vinc[E.EN]; }).length > 1) return null;
        return {
          domanda: t('Quale di questi è il più elettronegativo?',
                     'Which of these is the most electronegative?'),
          opzioni: q.map(function (y) { return y[E.NOME]; }),
          giusta: vinc[E.NOME],
          spiega: q.map(function (y) { return y[E.SIM] + ' ' + y[E.EN]; }).join(' · ') +
                  ' — ' + t('scala di Pauling', 'Pauling scale'),
          provenienza: 'ELEMENTS'
        };
      } },

    { id: 'configurazione', liv: 4, serve: ['ELEMENTS'],
      area: t('struttura elettronica', 'electronic structure'),
      fai: function (caso) {
        var el = fonte('ELEMENTS').filter(function (y) { return y[E.CONF]; });
        if (el.length < 6) return null;
        var x = scegli(caso, el);
        var d = distrattori(caso, el, x, 3, function (y) { return y[E.CONF]; });
        return {
          domanda: t('Qual è la configurazione elettronica di ',
                     'What is the electron configuration of ') + x[E.NOME] + '?',
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y[E.CONF]; }),
          giusta: x[E.CONF],
          spiega: x[E.NOME] + ' (Z = ' + x[E.Z] + ') → ' + x[E.CONF],
          provenienza: 'ELEMENTS'
        };
      } },

    /* ── gli spettri ──────────────────────────────────────────────────── */
    { id: 'ir-banda', liv: 2, serve: ['SPEC_DATA'],
      area: t('spettri IR', 'IR spectra'),
      fai: function (caso) {
        var ir = fonte('SPEC_DATA').ir;
        if (!ir || ir.length < 5) return null;
        var x = scegli(caso, ir);
        var d = distrattoriDisgiunti(caso, ir, x, 3, 'wn', function (y) { return y.group; });
        if (!d) return null;
        return {
          domanda: t('Una banda IR a ', 'An IR band at ') + x.wn +
                   t(' cm⁻¹ è compatibile con:', ' cm⁻¹ is compatible with:'),
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.group; }),
          giusta: x.group,
          spiega: x.group + ' · ' + x.wn + ' cm⁻¹ · ' + x.int +
                  (x.note ? ' · ' + x.note : ''),
          provenienza: 'SPEC_DATA.ir'
        };
      } },

    { id: 'h1-spostamento', liv: 3, serve: ['SPEC_DATA'],
      area: t('NMR protonico', 'proton NMR'),
      fai: function (caso) {
        var h = fonte('SPEC_DATA').nmr1h;
        if (!h || h.length < 5) return null;
        var x = scegli(caso, h);
        var d = distrattoriDisgiunti(caso, h, x, 3, 'ppm', function (y) { return y.group; });
        if (!d) return null;
        return {
          domanda: t('Un segnale ¹H a δ ', 'A ¹H signal at δ ') + x.ppm +
                   t(' ppm appartiene a:', ' ppm belongs to:'),
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.group; }),
          giusta: x.group,
          spiega: x.group + ' · δ ' + x.ppm + ' ppm' +
                  (x.mult ? ' · ' + x.mult : '') + (x.note ? ' · ' + x.note : ''),
          provenienza: 'SPEC_DATA.nmr1h'
        };
      } },

    { id: 'c13-spostamento', liv: 4, serve: ['SPEC_DATA'],
      area: t('NMR del carbonio', 'carbon NMR'),
      fai: function (caso) {
        var c = fonte('SPEC_DATA').nmr13c;
        if (!c || c.length < 5) return null;
        var x = scegli(caso, c);
        var d = distrattoriDisgiunti(caso, c, x, 3, 'ppm', function (y) { return y.group; });
        if (!d) return null;
        return {
          domanda: t('Un segnale ¹³C a δ ', 'A ¹³C signal at δ ') + x.ppm +
                   t(' ppm appartiene a:', ' ppm belongs to:'),
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.group; }),
          giusta: x.group,
          spiega: x.group + ' · δ ' + x.ppm + ' ppm' + (x.note ? ' · ' + x.note : ''),
          provenienza: 'SPEC_DATA.nmr13c'
        };
      } },

    { id: 'j-accoppiamento', liv: 4, serve: ['SPEC_DATA'],
      area: t('costanti di accoppiamento', 'coupling constants'),
      fai: function (caso) {
        var j = fonte('SPEC_DATA').jcoup;
        if (!j || j.length < 5) return null;
        var x = scegli(caso, j);
        var d = distrattoriDisgiunti(caso, j, x, 3, 'J', function (y) { return y.type; });
        if (!d) return null;
        return {
          domanda: t('Una costante J di ', 'A J constant of ') + x.J +
                   t(' corrisponde a:', ' corresponds to:'),
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.type; }),
          giusta: x.type,
          spiega: x.type + ' · J = ' + x.J + (x.example ? ' · ' + x.example : ''),
          provenienza: 'SPEC_DATA.jcoup'
        };
      } },

    { id: 'ir-assegna', liv: 5, serve: ['LETTORE'],
      area: t('assegnazione IR', 'IR assignment'),
      fai: function (caso) {
        var L = fonte('LETTORE');
        if (!L || !L.BANDE_IR || !L.assegnaIR) return null;
        var b = scegli(caso, L.BANDE_IR);
        var da = Math.min(b[0], b[1]), a = Math.max(b[0], b[1]);
        var onda = Math.round(da + caso() * (a - da));
        /* LA RISPOSTA LA CALCOLA IL MOTORE DELL'APPLICAZIONE, non io:
           `assegnaIR` restituisce tutte le assegnazioni compatibili. */
        var ass = L.assegnaIR(onda);
        if (!ass || !ass.length) return null;
        var giusta = ass[0].legame + ' · ' + ass[0].nota;
        /* i distrattori devono essere righe che NON contengono quel numero
           d'onda: `assegnaIR` elenca tutte le compatibili, quindi una riga
           compatibile messa fra i distrattori sarebbe un'altra risposta giusta */
        var pool = L.BANDE_IR.filter(function (r) {
          var da = Math.min(r[0], r[1]), a = Math.max(r[0], r[1]);
          return onda < da || onda > a;
        }).map(function (r) { return r[2] + ' · ' + r[3]; })
          .filter(function (s) { return s !== giusta; });
        if (pool.length < 3) return null;
        return {
          domanda: t('A ', 'At ') + onda + t(' cm⁻¹, quale assegnazione è compatibile?',
                                             ' cm⁻¹, which assignment is compatible?'),
          opzioni: mescola(caso, [giusta].concat(mescola(caso, pool).slice(0, 3))),
          giusta: giusta,
          spiega: t('Il lettore spettri elenca ', 'The spectrum reader lists ') +
                  ass.length + t(' assegnazioni compatibili a quel numero d’onda.',
                                 ' compatible assignments at that wavenumber.'),
          provenienza: 'BSILettoreSpettri.assegnaIR'
        };
      } },

    /* ── formule e masse ──────────────────────────────────────────────── */
    { id: 'insaturazioni', liv: 3, serve: ['ELUCIDA'],
      area: t('gradi di insaturazione', 'degrees of unsaturation'),
      fai: function (caso) {
        var EL = fonte('ELUCIDA');
        if (!EL || !EL.insaturazioni || !EL.leggiFormula) return null;
        /* una formula COSTRUITA, e il conto lo fa il motore dell'applicazione */
        var nC = 3 + Math.floor(caso() * 8);
        var nAnelli = Math.floor(caso() * 3);
        var nDoppi = Math.floor(caso() * 3);
        var nH = 2 * nC + 2 - 2 * (nAnelli + nDoppi);
        if (nH < 2) return null;
        var f = 'C' + nC + 'H' + nH;
        var g = EL.insaturazioni(f);
        var v = (g && typeof g === 'object') ? (g.gradi != null ? g.gradi : g.valore) : g;
        if (typeof v !== 'number' || !isFinite(v)) return null;
        var opts = [String(v)];
        [v + 1, v - 1, v + 2, v + 3].forEach(function (x) {
          if (x >= 0 && opts.indexOf(String(x)) < 0 && opts.length < 4) opts.push(String(x));
        });
        if (opts.length < 4) return null;
        return {
          domanda: t('Quanti gradi di insaturazione ha ',
                     'How many degrees of unsaturation does ') + f + t('?', ' have?'),
          opzioni: mescola(caso, opts),
          giusta: String(v),
          spiega: t('Per CcHh: gradi = (2c + 2 − h) / 2. Qui ',
                    'For CcHh: degrees = (2c + 2 − h) / 2. Here ') +
                  '(2·' + nC + ' + 2 − ' + nH + ') / 2 = ' + v,
          provenienza: 'BSIElucida.insaturazioni'
        };
      } },

    { id: 'massa-formula', liv: 4, serve: ['ELUCIDA'],
      area: t('massa molecolare', 'molecular mass'),
      fai: function (caso) {
        var EL = fonte('ELUCIDA');
        if (!EL || !EL.massaDa || !EL.leggiFormula || !EL.MASSA) return null;
        var nC = 2 + Math.floor(caso() * 8);
        var nH = 2 * nC + 2;
        var nO = Math.floor(caso() * 3);
        var f = 'C' + nC + 'H' + nH + (nO ? 'O' + (nO > 1 ? nO : '') : '');
        /* LA FIRMA VERA E' `massaDa(conta, tabella)`, non `massaDa(formula)`.
           La prima stesura passava la stringa e `massaDa` andava in errore a
           ogni giro: questo generatore era MORTO e non si vedeva, perché
           `domanda()` cattura l'errore e prova il generatore successivo. È il
           motivo per cui `disponibili()` adesso non si limita a guardare se la
           fonte esiste: PROVA il generatore. */
        var F = EL.leggiFormula(f);
        if (!F || !F.conta) return null;
        var v = EL.massaDa(F.conta, EL.MASSA);
        if (typeof v !== 'number' || !isFinite(v)) return null;
        var g = v.toFixed(2);
        var opts = [g];
        [v + 14.03, v - 14.03, v + 16, v - 2.02].forEach(function (x) {
          var s = x.toFixed(2);
          if (x > 0 && opts.indexOf(s) < 0 && opts.length < 4) opts.push(s);
        });
        if (opts.length < 4) return null;
        return {
          domanda: t('Quanto pesa ', 'What is the mass of ') + f + '?',
          opzioni: mescola(caso, opts),
          giusta: g,
          spiega: f + ' → ' + g + ' ' + t('(massa molecolare, calcolata dal motore)',
                                          '(molecular mass, computed by the engine)'),
          provenienza: 'BSIElucida.massaDa'
        };
      } },

    /* ── reazioni e sintesi ───────────────────────────────────────────── */
    { id: 'reazione-da-descrizione', liv: 3, serve: ['RXN'],
      area: t('riconoscere una reazione', 'recognising a reaction'),
      fai: function (caso) {
        var r = fonte('RXN').filter(function (x) { return x.t && x.d; });
        if (r.length < 5) return null;
        var x = scegli(caso, r);
        var d = distrattori(caso, r, x, 3, function (y) { return y.t; });
        return {
          domanda: t('Di che reazione si tratta? «', 'Which reaction is this? "') +
                   String(x.d).slice(0, 150) + '»',
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.t; }),
          giusta: x.t,
          spiega: x.t + ' — ' + String(x.d).slice(0, 170),
          provenienza: 'RXN'
        };
      } },

    { id: 'reazione-condizioni', liv: 5, serve: ['RXN'],
      area: t('condizioni di reazione', 'reaction conditions'),
      fai: function (caso) {
        var r = fonte('RXN').filter(function (x) { return x.t && x.cond; });
        if (r.length < 5) return null;
        var x = scegli(caso, r);
        var d = distrattori(caso, r, x, 3, function (y) { return y.cond; });
        return {
          domanda: t('Quali sono le condizioni tipiche della «',
                     'What are the typical conditions of "') + x.t + '»?',
          opzioni: mescola(caso, [x].concat(d)).map(function (y) {
            return String(y.cond).slice(0, 80); }),
          giusta: String(x.cond).slice(0, 80),
          spiega: x.t + ' · ' + x.cond,
          provenienza: 'RXN'
        };
      } },

    { id: 'retro-disconnessione', liv: 5, serve: ['RETRO'],
      area: t('retrosintesi', 'retrosynthesis'),
      fai: function (caso) {
        var r = fonte('RETRO').filter(function (x) { return x.name && x.target; });
        if (r.length < 5) return null;
        var x = scegli(caso, r);
        var d = distrattori(caso, r, x, 3, function (y) { return y.name; });
        return {
          domanda: t('Per il bersaglio «', 'For the target "') +
                   String(x.target).slice(0, 90) +
                   t('», quale disconnessione?', '", which disconnection?'),
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.name; }),
          giusta: x.name,
          spiega: x.name + ' — ' + String(x.disconnection || '').slice(0, 170),
          provenienza: 'RETRO_STRATEGIES'
        };
      } },

    /* ── molecole e linguaggi ─────────────────────────────────────────── */
    { id: 'amminoacido-codice', liv: 2, serve: ['AA'],
      area: t('amminoacidi', 'amino acids'),
      fai: function (caso) {
        var aa = fonte('AA').filter(function (x) { return x.name && x.code3; });
        if (aa.length < 5) return null;
        var x = scegli(caso, aa);
        var d = distrattori(caso, aa, x, 3, function (y) { return y.code3; });
        return {
          domanda: t('Qual è il codice a tre lettere della ',
                     'What is the three-letter code of ') + x.name + '?',
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.code3; }),
          giusta: x.code3,
          spiega: x.name + ' = ' + x.code3 + ' (' + x.code1 + ')' +
                  (x.mw ? ' · MW ' + x.mw : ''),
          provenienza: 'AA_DATA'
        };
      } },

    { id: 'molecola-da-smiles', liv: 4, serve: ['AA'],
      area: t('riconoscere una molecola', 'recognising a molecule'),
      fai: function (caso) {
        var aa = fonte('AA').filter(function (x) { return x.name && x.smi; });
        if (aa.length < 5) return null;
        var x = scegli(caso, aa);
        var d = distrattori(caso, aa, x, 3, function (y) { return y.name; });
        return {
          domanda: t('Che molecola è ', 'Which molecule is ') + x.smi + '?',
          opzioni: mescola(caso, [x].concat(d)).map(function (y) { return y.name; }),
          giusta: x.name,
          spiega: x.name + ' · SMILES ' + x.smi +
                  (x.desc ? ' · ' + String(x.desc).slice(0, 110) : ''),
          provenienza: 'AA_DATA'
        };
      } },

    { id: 'linguaggio-riconosci', liv: 2, serve: ['AA'],
      area: t('linguaggi della chimica', 'chemical languages'),
      fai: function (caso) {
        /* QUESTA DOMANDA SI REGGE SU UNA PROPRIETA' DI FORMA, NON SU DATI
           RICORDATI: un InChI comincia sempre per `InChI=1S/`, uno SMARTS
           porta le parentesi quadre con i costrutti `[#6]`, `[$(...)]`, uno
           SMILES e' nudo. Gli SMILES veri vengono da AA_DATA; lo SMARTS e
           l'InChI si costruiscono dalla FORMA, che e' verificabile a vista. */
        var aa = fonte('AA').filter(function (x) { return x.smi; });
        if (aa.length < 3) return null;
        var smiles = scegli(caso, aa).smi;
        var casi = [
          { s: smiles, k: 'SMILES' },
          { s: 'InChI=1S/C2H4O2/c1-2(3)4/h1H3,(H,3,4)', k: 'InChI' },
          { s: '[CX3](=[OX1])[OX2H1]', k: 'SMARTS' },
          { s: 'C(=O)O', k: 'SMILES' }
        ];
        var x = scegli(caso, casi.slice(0, 3));
        return {
          domanda: t('In che linguaggio è scritto «', 'In which language is "') +
                   x.s.slice(0, 48) + '»?',
          opzioni: mescola(caso, ['SMILES', 'InChI', 'SMARTS',
                                  t('nome IUPAC', 'IUPAC name')]),
          giusta: x.k,
          spiega: x.k === 'InChI'
            ? t('Un InChI comincia sempre per «InChI=1S/»: è un identificatore, ' +
                'non una struttura da leggere.',
                'An InChI always starts with "InChI=1S/": it is an identifier, not a ' +
                'structure to read.')
            : (x.k === 'SMARTS'
              ? t('Uno SMARTS descrive un MOTIVO da cercare, non una molecola: ' +
                  '[CX3] vuol dire «carbonio con tre connessioni».',
                  'A SMARTS describes a PATTERN to search for, not a molecule: [CX3] ' +
                  'means "carbon with three connections".')
              : t('Uno SMILES descrive una molecola precisa, atomo per atomo.',
                  'A SMILES describes one precise molecule, atom by atom.')),
          provenienza: x.k === 'SMILES' ? 'AA_DATA' : t('forma del linguaggio', 'language form')
        };
      } }
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     L'INTERFACCIA
     ═════════════════════════════════════════════════════════════════════════ */

  /* QUALI GENERATORI GIRANO DAVVERO.
     La prima stesura rispondeva guardando se le FONTI esistevano, e diceva
     «gira» di un generatore che andava in errore a ogni chiamata: `massaDa`
     chiamato con la firma sbagliata. Siccome `domanda()` cattura l'errore e
     passa al successivo, il guasto era invisibile — un generatore su
     diciannove non produceva mai niente e nessuno lo sapeva.
     «Gira» adesso vuol dire una cosa sola: PROVATO, e ha restituito una
     domanda. Si tenta qualche seme, perché un generatore può rinunciare
     legittimamente su certi dati. */
  function disponibili(tentativi) {
    var n = tentativi || 12;
    return GEN.map(function (g) {
      var mancanti = g.serve.filter(function (x) { return !fonte(x); });
      var riuscite = 0, errore = null;
      if (!mancanti.length) {
        for (var i = 0; i < n; i++) {
          try { if (g.fai(Caso(i * 97 + 11))) riuscite++; }
          catch (e) { if (!errore) errore = String(e && e.message || e).slice(0, 90); }
        }
      }
      return { id: g.id, liv: g.liv, area: g.area,
               gira: riuscite > 0, riuscite: riuscite, su: n,
               mancanti: mancanti, errore: errore };
    });
  }

  /* una domanda al livello di difficolta' chiesto (1..5): si pescano i
     generatori di livello <= difficolta, e si prova finche' uno riesce */
  function domanda(difficolta, seme) {
    var caso = Caso(seme || ((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0));
    var d = Math.max(1, Math.min(5, difficolta || 1));
    var idonei = GEN.filter(function (g) {
      return g.liv <= d + 1 && g.serve.every(function (n) { return !!fonte(n); });
    });
    /* alla difficolta' massima si preferiscono i livelli alti: la difficolta'
       cambia QUALI domande arrivano, non quanto sono scritte male */
    if (d >= 4) {
      var alti = idonei.filter(function (g) { return g.liv >= 3; });
      if (alti.length >= 3) idonei = alti;
    }
    if (!idonei.length) return null;
    var ordine = mescola(caso, idonei);
    for (var i = 0; i < ordine.length; i++) {
      var q = null;
      try { q = ordine[i].fai(caso); } catch (e) { q = null; }
      if (!q || !q.opzioni || q.opzioni.length < 2) continue;
      /* un'opzione ripetuta renderebbe la domanda ambigua */
      var visti = {}, ok = true;
      q.opzioni.forEach(function (o) { if (visti[o]) ok = false; visti[o] = 1; });
      if (!ok) continue;
      if (q.opzioni.indexOf(q.giusta) < 0) continue;
      q.id = ordine[i].id;
      q.liv = ordine[i].liv;
      q.area = ordine[i].area;
      return q;
    }
    return null;
  }

  globale.BSIGiocoDomande = {
    GEN: GEN,
    quanti: GEN.length,
    disponibili: disponibili,
    domanda: domanda,
    Caso: Caso,
    intervallo: intervallo, siSovrappongono: siSovrappongono,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
