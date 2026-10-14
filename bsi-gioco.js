/* ═══════════════════════════════════════════════════════════════════════════
   bsi-gioco — «Tavola Periodica: la Corsa degli Elementi»

   UN PLATFORM RETRO IN CUI I POTENZIAMENTI SONO ELEMENTI

   Si corre, si salta, si abbattono nemici. I potenziamenti non sono fiori:
   sono ELEMENTI della tavola periodica, e ognuno trasforma il personaggio
   dandogli un'abilita' che viene dalla chimica di quell'elemento — l'idrogeno
   e' il piu' leggero e fa saltare piu' alto, il fluoro e' il piu'
   elettronegativo e il suo colpo e' il piu' forte, l'alluminio si passiva con
   il suo ossido e regge un colpo, il mercurio e' liquido e fa correre.

   Dodici livelli in quattro zone, un boss alla fine di ogni zona e il boss
   finale al dodicesimo. Nessun asset esterno: tutto disegnato a rettangoli su
   una tela 480×270 ingrandita a numeri interi, e tutti i suoni sintetizzati.
   Funziona OFFLINE perche' non c'e' niente da scaricare.

   LE DOMANDE NON SONO DI QUESTO FILE

   Ai punti di controllo arriva una domanda di chimica. Le domande stanno in
   `bsi-gioco-domande.js`, che non le CONTIENE: le genera dalle tabelle che
   l'applicazione ha gia'. Se la tabella e' giusta, la domanda e' giusta.
   Qui c'e' solo il momento in cui chiederla e che cosa succede dopo.

   TRE DECISIONI TECNICHE CHE VALE LA PENA SPIEGARE

   1. PASSO FISSO. La fisica avanza a 1/60 di secondo con un accumulatore, e
      il disegno a quanti fotogrammi riesce. Con un passo variabile la stessa
      sequenza di tasti darebbe salti diversi su macchine diverse, e un salto
      che a volte arriva e a volte no non e' un gioco, e' una lotteria.

   2. IL LIVELLO E' GENERATO DA UN SEME. «Tutto randomico», come chiesto — ma
      il seme viene da (livello, difficolta', partita), quindi una partita si
      puo' RIPETERE identica. Senza questo nessun banco potrebbe verificare
      che un livello sia percorribile: misurerebbe ogni volta un altro
      livello.

   3. IL CICLO SI FERMA QUANDO LA SEZIONE NON SI VEDE. Un
      `requestAnimationFrame` lasciato girare in una sezione nascosta
      consuma batteria per sempre e falsa le misure di fluidita' di tutte le
      altre sezioni. Si controlla a ogni fotogramma e si esce.

   USO   si innesta da se'; `BSIGioco` per il banco.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var ID = 'sgioco';
  var LARGO = 480, ALTO = 270;        /* risoluzione logica, retro */
  var G = 0.62;                       /* gravità, in pixel logici al passo² */
  var PASSO = 1000 / 60;

  /* ═════════════════════════════════════════════════════════════════════════
     IL NOME, E UN FONT A PIXEL PER SCRIVERLO

     Il gioco si chiama **ELEMENTIA**. Il titolo non e' un `<h1>`: e'
     DISEGNATO sulla tela, lettera per lettera, con un font a cinque per
     sette pixel scritto qui sotto. In un gioco retro il titolo fa parte del
     gioco — un titolo in HTML sopra una tela a pixel si vede subito che e'
     un'altra cosa.

     Il font sta come disegno e non come numeri perche' un font scritto in
     maschere di bit non si puo' leggere ne' correggere: cosi' invece una
     lettera storta si vede a occhio nel sorgente.
     ═════════════════════════════════════════════════════════════════════════ */
  var NOME = 'ELEMENTIA';

  var FONT = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..##', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
    '·': ['.....', '.....', '.....', '..#..', '.....', '.....', '.....'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    ':': ['.....', '..#..', '.....', '.....', '.....', '..#..', '.....'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
    '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
    ',': ['.....', '.....', '.....', '.....', '.....', '..#..', '.#...']
  };

  /* larghezza in pixel logici di un testo a una data scala */
  function largoTesto(testo, k) {
    return String(testo).length * (5 * k + k) - k;
  }

  /* scrive a pixel. `c2` disegna un'ombra sotto, che a questa dimensione e'
     l'unico modo di staccare le lettere dal fondo */
  function scrivi(testo, x, y, k, c1, c2) {
    var t2 = String(testo).toUpperCase();
    var cx = x;
    for (var i = 0; i < t2.length; i++) {
      var g = FONT[t2[i]] || FONT[' '];
      for (var r = 0; r < 7; r++) {
        for (var q = 0; q < 5; q++) {
          if (g[r][q] !== '#') continue;
          if (c2) { ctx.fillStyle = c2; ctx.fillRect(cx + q * k + k, y + r * k + k, k, k); }
          ctx.fillStyle = c1;
          ctx.fillRect(cx + q * k, y + r * k, k, k);
        }
      }
      cx += 5 * k + k;
    }
    return cx - k - x;
  }

  function scriviCentrato(testo, y, k, c1, c2) {
    return scrivi(testo, Math.round((LARGO - largoTesto(testo, k)) / 2), y, k, c1, c2);
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE DIFFICOLTA'

     I nomi sono di chimica e non sono decorativi: dicono quanto il sistema
     e' «reattivo». Il numero di vite, la velocita' dei nemici, quanti ce ne
     sono e il livello delle domande cambiano insieme.
     ═════════════════════════════════════════════════════════════════════════ */
  function DIFFICOLTA() {
    return [
      { n: 1, nome: t('Soluzione diluita', 'Dilute solution'),
        sotto: t('poca roba in giro, tutto lento', 'few things around, all slow'),
        vite: 5, nemici: 0.6, vel: 0.75, livDomanda: 1, sbaglioCosta: false, tempo: 0 },
      { n: 2, nome: t('Soluzione satura', 'Saturated solution'),
        sotto: t('più nemici, più potenziamenti', 'more enemies, more power-ups'),
        vite: 4, nemici: 0.85, vel: 0.9, livDomanda: 2, sbaglioCosta: false, tempo: 0 },
      { n: 3, nome: t('Reazione esotermica', 'Exothermic reaction'),
        sotto: t('le cose si scaldano: sbagliare costa', 'things heat up: mistakes cost'),
        vite: 3, nemici: 1, vel: 1, livDomanda: 3, sbaglioCosta: true, tempo: 0 },
      { n: 4, nome: t('Catalisi enzimatica', 'Enzymatic catalysis'),
        sotto: t('tutto più rapido, domande da esame', 'everything faster, exam questions'),
        vite: 2, nemici: 1.25, vel: 1.15, livDomanda: 4, sbaglioCosta: true, tempo: 25 },
      { n: 5, nome: t('Fusione nucleare', 'Nuclear fusion'),
        sotto: t('una vita, nemici feroci, venti secondi per rispondere',
                 'one life, fierce enemies, twenty seconds to answer'),
        vite: 1, nemici: 1.5, vel: 1.3, livDomanda: 5, sbaglioCosta: true, tempo: 20 }
    ];
  }

  /* ═════════════════════════════════════════════════════════════════════════
     GLI ELEMENTI COME POTENZIAMENTI

     L'abilita' e' progetto di gioco; il PERCHE' viene dalla chimica, e il
     nome, il numero atomico e la nota descrittiva si leggono da `ELEMENTS`,
     la tavola periodica che l'applicazione ha gia'. Non riscrivo i dati di
     118 elementi per un gioco.
     ═════════════════════════════════════════════════════════════════════════ */
  var POTERI = [
    { sim: 'H',  ab: 'salto',    perche: t('il più leggero che esista: spinge più in alto',
                                           'the lightest there is: it pushes you higher') },
    { sim: 'He', ab: 'planata',  perche: t('gas nobile più leggero dell’aria: si scende piano',
                                           'noble gas lighter than air: you fall slowly') },
    { sim: 'C',  ab: 'quattro',  perche: t('quattro legami: quattro colpi a ventaglio',
                                           'four bonds: four shots in a fan') },
    { sim: 'N',  ab: 'perfora',  perche: t('triplo legame, fra i più robusti: il colpo passa oltre',
                                           'triple bond, among the strongest: the shot goes through') },
    { sim: 'O',  ab: 'spara',    perche: t('ossida quello che tocca', 'it oxidises what it touches') },
    { sim: 'F',  ab: 'forte',    perche: t('il più elettronegativo: nessuno regge il suo colpo',
                                           'the most electronegative: nothing withstands its shot') },
    { sim: 'Na', ab: 'esplodi',  perche: t('con l’acqua reagisce violentemente',
                                           'with water it reacts violently') },
    { sim: 'Mg', ab: 'invinc',   perche: t('brucia con fiamma bianca accecante',
                                           'it burns with a blinding white flame') },
    { sim: 'Al', ab: 'scudo1',   perche: t('si passiva con il proprio ossido: un colpo lo regge',
                                           'it passivates with its own oxide: it takes one hit') },
    { sim: 'Si', ab: 'scudo2',   perche: t('semiconduttore: lo scudo si ricarica',
                                           'semiconductor: the shield recharges') },
    { sim: 'S',  ab: 'rallenta', perche: t('lo zolfo intossica i catalizzatori: i nemici rallentano',
                                           'sulfur poisons catalysts: the enemies slow down') },
    { sim: 'Cl', ab: 'pulisci',  perche: t('disinfetta: ripulisce quello che ha intorno',
                                           'it disinfects: it clears what is around') },
    { sim: 'Fe', ab: 'tuffo',    perche: t('pesante e ferromagnetico: sfonda cadendo',
                                           'heavy and ferromagnetic: it smashes through falling') },
    { sim: 'Cu', ab: 'fulmine',  perche: t('conduce: il colpo è una scarica',
                                           'it conducts: the shot is a discharge') },
    { sim: 'Zn', ab: 'armatura', perche: t('zinca: protegge il ferro sacrificandosi',
                                           'it galvanises: it protects iron by sacrificing itself') },
    { sim: 'Ag', ab: 'doppio',   perche: t('il miglior conduttore: raddoppia tutto',
                                           'the best conductor: it doubles everything') },
    { sim: 'Au', ab: 'inerte',   perche: t('non si ossida: gli ossidanti non lo toccano',
                                           'it does not oxidise: oxidisers cannot touch it') },
    { sim: 'Hg', ab: 'veloce',   perche: t('metallo liquido: scorre', 'liquid metal: it flows') },
    { sim: 'Pb', ab: 'schermo',  perche: t('denso: ferma le radiazioni e i proiettili',
                                           'dense: it stops radiation and bullets') },
    { sim: 'U',  ab: 'radio',    perche: t('radioattivo: danneggia tutto quello che gli sta vicino',
                                           'radioactive: it damages everything nearby') }
  ];

  /* i colori: una tavolozza retro, non i colori della tavola periodica vera —
     servono a distinguere a colpo d'occhio su 480×270 */
  var COLORI = {
    salto: '#8be9fd', planata: '#c8f7ff', quattro: '#50fa7b', perfora: '#7cf0d0',
    spara: '#ff79c6', forte: '#ffd93d', esplodi: '#ff6b6b', invinc: '#ffffff',
    scudo1: '#9aa5b1', scudo2: '#b8a6ff', rallenta: '#f1fa8c', pulisci: '#6bffd0',
    tuffo: '#d08f5a', fulmine: '#ffb86c', armatura: '#a0c4d8', doppio: '#e8e8f0',
    inerte: '#ffd700', veloce: '#c0c6d0', schermo: '#7a8290', radio: '#9fff5e'
  };

  /* chi spara, e con che forza */
  var SPARA = { spara: 1, forte: 3, quattro: 1, perfora: 2, fulmine: 2, esplodi: 2, radio: 1 };

  function datiElemento(sim) {
    try {
      var el = globale.ELEMENTS;
      if (!el) return null;
      for (var i = 0; i < el.length; i++) if (el[i][1] === sim) {
        return { Z: el[i][0], sim: el[i][1], nome: el[i][2], nota: el[i][13] || '' };
      }
    } catch (e) {}
    return null;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL CASO, CON UN SEME
     ═════════════════════════════════════════════════════════════════════════ */
  function Caso(seme) {
    var s = (seme || 1) >>> 0;
    if (!s) s = 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL LIVELLO

     Una striscia di colonne. Ogni colonna ha un'altezza di terreno (o un
     vuoto), e sopra possono starci piattaforme, blocchi, nemici, elementi.
     Generata dal seme, quindi ripetibile.

     LA REGOLA CHE RENDE UN LIVELLO GIOCABILE: un vuoto non puo' essere piu'
     largo di quanto un salto possa coprire, e un gradino non piu' alto di
     quanto un salto possa scavalcare. Non e' un dettaglio estetico: un
     livello generato a caso senza questa regola produce muri invalicabili, e
     chi gioca non ha modo di sapere che il gioco e' rotto e non lui.
     ═════════════════════════════════════════════════════════════════════════ */
  var TILE = 16;
  var SALTO_MAX_VUOTO = 4;     /* colonne di vuoto scavalcabili con un salto */
  var SALTO_MAX_GRADINO = 3;   /* tile di dislivello scavalcabili */

  function generaLivello(livello, diff, partita) {
    var caso = Caso((livello * 7919 + diff * 104729 + partita * 15485863) >>> 0);
    var colonne = 150 + livello * 10;
    var boss = (livello % 3 === 0);
    var mappa = [];
    var hMin = 2, hMax = 7;
    var h = 3;
    var i;
    for (i = 0; i < colonne; i++) {
      var col = { h: h, vuoto: false, piattaforma: 0, blocco: false };
      /* I PRIMI OTTO PIANI, E GLI ULTIMI RACCORDATI.
         La prima stesura metteva `h = 3` di colpo sugli ultimi otto: se
         l'altezza era 7, il raccordo diventava un gradino di QUATTRO tile.
         Misurato: cinque livelli su sessanta avevano un gradino che il salto
         non copre (8,6² / (2·0,62) = 59,6 px = 3,7 tile), quindi un muro
         invalicabile — e chi gioca non ha modo di sapere che è rotto il
         livello e non lui. Qui si scende di un tile per colonna. */
      if (i < 8) { col.h = 3; h = 3; mappa.push(col); continue; }
      if (i > colonne - 9) {
        h = (h > 3) ? h - 1 : ((h < 3) ? h + 1 : 3);
        col.h = h;
        mappa.push(col);
        continue;
      }
      /* un vuoto, mai piu' largo del salto */
      if (caso() < 0.055) {
        var largo = 1 + Math.floor(caso() * SALTO_MAX_VUOTO);
        for (var k = 0; k < largo && i < colonne - 9; k++, i++) {
          mappa.push({ h: h, vuoto: true, piattaforma: 0, blocco: false });
        }
        i--;
        continue;
      }
      /* un gradino, mai piu' alto di quanto un salto scavalchi */
      if (caso() < 0.2) {
        var d = Math.round((caso() * 2 - 1) * SALTO_MAX_GRADINO);
        h = Math.max(hMin, Math.min(hMax, h + d));
        col.h = h;
      }
      /* una piattaforma sospesa, a portata di salto dal terreno */
      if (caso() < 0.12) col.piattaforma = col.h + 3 + Math.floor(caso() * 2);
      /* un blocco rompibile */
      if (caso() < 0.07) col.blocco = true;
      mappa.push(col);
    }

    /* i nemici: densita' dalla difficolta' */
    var nemici = [];
    var quanti = Math.round((8 + livello * 1.6) * diff.nemici);
    for (i = 0; i < quanti; i++) {
      var c = 14 + Math.floor(caso() * (colonne - 30));
      if (mappa[c].vuoto) continue;
      var tipo = caso() < 0.62 ? 'cammina' : (caso() < 0.8 ? 'salta' : 'vola');
      nemici.push({
        x: c * TILE, y: (ALTO - (mappa[c].h + 1) * TILE) - (tipo === 'vola' ? 48 : 0),
        vx: (caso() < 0.5 ? -1 : 1) * (0.5 + caso() * 0.5) * diff.vel,
        vy: 0, tipo: tipo, vivo: true, w: 12, h: 12, t: caso() * 100,
        /* un nemico «ossidante» è quello che l'oro ignora: la chimica dentro
           la regola, non accanto */
        ossidante: caso() < 0.4
      });
    }

    /* gli elementi: randomici, come chiesto, ma garantiti prima di un boss —
       un boss senza un elemento che spari sarebbe invincibile */
    var elementi = [];
    var quantiEl = 3 + Math.floor(caso() * 3) + (diff.n <= 2 ? 2 : 0);
    for (i = 0; i < quantiEl; i++) {
      var ce = 16 + Math.floor(caso() * (colonne - 40));
      if (mappa[ce].vuoto) continue;
      var p = POTERI[Math.floor(caso() * POTERI.length)];
      elementi.push({ x: ce * TILE, y: ALTO - (mappa[ce].h + 2) * TILE - 4,
                      sim: p.sim, ab: p.ab, preso: false, t: caso() * 100 });
    }
    if (boss) {
      /* garantito: un potere che spara, poco prima dell'arena */
      var sparanti = POTERI.filter(function (p2) { return SPARA[p2.ab]; });
      var ps = sparanti[Math.floor(caso() * sparanti.length)];
      var cs = colonne - 26;
      elementi.push({ x: cs * TILE, y: ALTO - (mappa[cs].h + 2) * TILE - 4,
                      sim: ps.sim, ab: ps.ab, preso: false, t: 0, garantito: true });
    }

    /* i punti di controllo: due per livello, dove arriva la domanda */
    var controlli = [
      { x: Math.round(colonne * 0.35) * TILE, fatto: false },
      { x: Math.round(colonne * 0.7) * TILE, fatto: false }
    ];

    return {
      livello: livello, zona: Math.ceil(livello / 3), boss: boss,
      colonne: colonne, mappa: mappa, nemici: nemici, elementi: elementi,
      controlli: controlli, largo: colonne * TILE,
      /* il boss finale è al dodicesimo: più vita e due fasi */
      finale: livello === LIVELLI
    };
  }

  function terrenoA(liv, px) {
    var c = Math.floor(px / TILE);
    if (c < 0) c = 0;
    if (c >= liv.mappa.length) c = liv.mappa.length - 1;
    var m = liv.mappa[c];
    if (m.vuoto) return ALTO + 200;            /* il vuoto: si cade */
    return ALTO - m.h * TILE;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LO STATO
     ═════════════════════════════════════════════════════════════════════════ */
  /* QUANTI LIVELLI. Il numero stava scritto a mano in sei punti: il titolo,
     la barra in alto, la schermata di livello, quella di fine, la fine del
     gioco e la generazione dell'ultimo livello. Sei copie dello stesso numero
     sono cinque occasioni di sbagliarlo. Dodici: abbastanza da avere quattro
     zone e quattro boss, pochi abbastanza da arrivare in fondo. */
  var LIVELLI = 12;

  var S = null;        /* stato di partita, null = nessuna partita */
  var schermo = 'titolo';
  var tela = null, ctx = null, scala = 2;
  var anim = null, ultimo = 0, accumulo = 0;
  var tasti = {};
  var suono = true;
  var audio = null;

  function nuovaPartita(nDiff) {
    var diff = DIFFICOLTA()[nDiff - 1] || DIFFICOLTA()[0];
    S = {
      diff: diff, partita: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0,
      livello: 1, vite: diff.vite, punti: 0, moltiplicatore: 1,
      elemento: null, scudo: 0, invincibile: 0, tempoRisposta: diff.tempo,
      risposteGiuste: 0, risposteSbagliate: 0,
      proiettili: [], particelle: [],
      p: null, liv: null, cam: 0, boss: null, finito: null
    };
    caricaLivello(1);
    return S;
  }

  function caricaLivello(n) {
    S.livello = n;
    S.liv = generaLivello(n, S.diff, S.partita);
    S.p = { x: 40, y: ALTO - 4 * TILE, vx: 0, vy: 0, w: 11, h: 14,
            terra: false, guarda: 1, coyote: 0, salto: 0, anim: 0 };
    S.cam = 0;
    S.proiettili = [];
    S.particelle = [];
    S.boss = S.liv.boss ? {
      x: S.liv.largo - 120, y: ALTO - 6 * TILE, vx: 0, vy: 0, w: 34, h: 34,
      vita: S.liv.finale ? 10 : 5, max: S.liv.finale ? 10 : 5,
      fase: 1, t: 0, colpito: 0, attivo: false
    } : null;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL SUONO — sintetizzato, perché un file audio non funziona offline se
     non è stato scaricato, e qui non si scarica niente
     ═════════════════════════════════════════════════════════════════════════ */
  function bip(freq, durata, tipo, vol) {
    if (!suono) return;
    try {
      if (!audio) audio = new (globale.AudioContext || globale.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = tipo || 'square';
      o.frequency.value = freq;
      g.gain.value = (vol == null ? 0.06 : vol);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (durata || 0.08));
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + (durata || 0.08));
    } catch (e) { /* senza audio il gioco funziona uguale */ }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LA FISICA — passo fisso
     ═════════════════════════════════════════════════════════════════════════ */
  function abilita() { return S && S.elemento ? S.elemento.ab : null; }

  function passo() {
    if (!S || !S.liv || schermo !== 'gioco') return;
    var p = S.p, liv = S.liv, ab = abilita();

    /* ── movimento ────────────────────────────────────────────────────── */
    var velMax = 2.3 * (ab === 'veloce' ? 1.5 : 1);
    var acc = 0.34;
    if (tasti.sx) { p.vx -= acc; p.guarda = -1; }
    if (tasti.dx) { p.vx += acc; p.guarda = 1; }
    if (!tasti.sx && !tasti.dx) p.vx *= 0.82;
    p.vx = Math.max(-velMax, Math.min(velMax, p.vx));

    /* ── salto, con coyote time e altezza variabile ───────────────────── */
    var forza = 8.6 * (ab === 'salto' ? 1.22 : 1);
    if (tasti.su && (p.terra || p.coyote > 0) && p.salto <= 0) {
      p.vy = -forza; p.terra = false; p.coyote = 0; p.salto = 12;
      bip(420, 0.07, 'square');
    }
    if (p.salto > 0) {
      p.salto--;
      /* lasciando il tasto il salto si accorcia: è la differenza fra un
         salto che si controlla e uno che decide da sé */
      if (!tasti.su && p.vy < -3) p.vy = -3;
    }
    p.vy += G * (ab === 'planata' && p.vy > 0 ? 0.42 : 1);
    if (p.vy > 11) p.vy = 11;

    /* ── collisione col terreno ───────────────────────────────────────── */
    p.x += p.vx;
    if (p.x < 4) { p.x = 4; p.vx = 0; }
    if (p.x > liv.largo - 20) p.x = liv.largo - 20;
    var yPrima = p.y;
    p.y += p.vy;
    var suolo = Math.min(terrenoA(liv, p.x - p.w / 2), terrenoA(liv, p.x + p.w / 2));
    /* le piattaforme sospese: si atterra solo scendendo */
    var cp = Math.floor(p.x / TILE);
    var piatta = null;
    for (var dc = -1; dc <= 1; dc++) {
      var mm = liv.mappa[cp + dc];
      if (mm && mm.piattaforma) {
        var yp = ALTO - mm.piattaforma * TILE;
        if (yPrima + p.h / 2 <= yp + 3 && p.y + p.h / 2 >= yp && p.vy >= 0) {
          if (piatta === null || yp < piatta) piatta = yp;
        }
      }
    }
    if (piatta !== null && piatta < suolo) suolo = piatta;

    if (p.y + p.h / 2 >= suolo) {
      p.y = suolo - p.h / 2;
      if (p.vy > 0) p.vy = 0;
      p.terra = true; p.coyote = 7;
    } else {
      p.terra = false;
      if (p.coyote > 0) p.coyote--;
    }
    /* caduta nel vuoto */
    if (p.y > ALTO + 60) { perdiVita(t('sei caduto nel vuoto', 'you fell into the void')); return; }

    /* ── la camera ────────────────────────────────────────────────────── */
    var voluta = p.x - LARGO * 0.38;
    S.cam += (voluta - S.cam) * 0.12;
    S.cam = Math.max(0, Math.min(liv.largo - LARGO, S.cam));

    /* ── sparare ──────────────────────────────────────────────────────── */
    if (tasti.fuoco && SPARA[ab] && (S.p.ricarica || 0) <= 0) {
      var forzaC = SPARA[ab];
      var n = (ab === 'quattro') ? 4 : 1;
      for (var s = 0; s < n; s++) {
        S.proiettili.push({
          x: p.x + p.guarda * 8, y: p.y - 2 + (n > 1 ? (s - 1.5) * 3 : 0),
          vx: p.guarda * 4.2, vy: (n > 1 ? (s - 1.5) * 0.5 : 0),
          forza: forzaC, perfora: ab === 'perfora', vivo: true, t: 0
        });
      }
      S.p.ricarica = ab === 'forte' ? 18 : 11;
      bip(ab === 'forte' ? 900 : 660, 0.05, 'sawtooth', 0.05);
    }
    if (S.p.ricarica > 0) S.p.ricarica--;

    /* i poteri ad area: Cl pulisce, U e Na danneggiano quello che hanno intorno */
    if (ab === 'pulisci' || ab === 'radio' || ab === 'esplodi') {
      var raggio = ab === 'pulisci' ? 46 : 34;
      liv.nemici.forEach(function (e) {
        if (!e.vivo) return;
        if (Math.abs(e.x - p.x) < raggio && Math.abs(e.y - p.y) < raggio) {
          if ((S.p.areaT || 0) <= 0) { uccidi(e); }
        }
      });
      if ((S.p.areaT || 0) <= 0) S.p.areaT = ab === 'pulisci' ? 40 : 70;
    }
    if (S.p.areaT > 0) S.p.areaT--;

    /* ── i proiettili ─────────────────────────────────────────────────── */
    S.proiettili.forEach(function (b) {
      if (!b.vivo) return;
      b.x += b.vx; b.y += b.vy; b.t++;
      if (b.t > 70 || b.x < S.cam - 20 || b.x > S.cam + LARGO + 20) b.vivo = false;
      liv.nemici.forEach(function (e) {
        if (!e.vivo || !b.vivo) return;
        if (Math.abs(e.x - b.x) < 9 && Math.abs(e.y - b.y) < 9) {
          uccidi(e);
          if (!b.perfora) b.vivo = false;
        }
      });
      if (S.boss && S.boss.attivo && b.vivo &&
          Math.abs(S.boss.x - b.x) < 22 && Math.abs(S.boss.y - b.y) < 22) {
        S.boss.vita -= b.forza;
        S.boss.colpito = 10;
        b.vivo = false;
        bip(180, 0.1, 'square', 0.08);
        if (S.boss.vita <= 0) vinciLivello();
      }
    });
    S.proiettili = S.proiettili.filter(function (b) { return b.vivo; });

    /* ── i nemici ─────────────────────────────────────────────────────── */
    var lento = (ab === 'rallenta') ? 0.45 : 1;
    liv.nemici.forEach(function (e) {
      if (!e.vivo) return;
      if (Math.abs(e.x - p.x) > LARGO) return;      /* fuori scena: fermi */
      e.t++;
      if (e.tipo === 'vola') {
        e.x += e.vx * lento;
        e.y += Math.sin(e.t / 22) * 0.8;
      } else {
        e.x += e.vx * lento;
        var sE = terrenoA(liv, e.x);
        if (e.tipo === 'salta' && e.t % 72 === 0) e.vy = -6.2;
        e.vy += G * 0.9;
        e.y += e.vy;
        if (e.y + e.h / 2 >= sE) { e.y = sE - e.h / 2; e.vy = 0; }
        /* davanti a un vuoto o a un muro si gira: un nemico che cade nel
           vuoto da sé rende il livello più facile a caso */
        var avanti = terrenoA(liv, e.x + e.vx * 8);
        if (avanti > ALTO + 100 || Math.abs(avanti - sE) > TILE * 2) e.vx = -e.vx;
      }
      /* contatto col giocatore */
      if (Math.abs(e.x - p.x) < 11 && Math.abs(e.y - p.y) < 13) {
        /* saltandoci sopra si schiaccia: è la grammatica del genere */
        if (p.vy > 1.2 && p.y < e.y - 2) {
          uccidi(e);
          p.vy = -6.4;
        } else if (ab === 'inerte' && e.ossidante) {
          /* l'oro non si ossida: quel nemico non lo tocca */
        } else if (S.invincibile > 0 || ab === 'invinc') {
          uccidi(e);
        } else {
          colpito();
        }
      }
    });

    /* ── gli elementi da raccogliere ──────────────────────────────────── */
    liv.elementi.forEach(function (el) {
      if (el.preso) return;
      el.t++;
      if (Math.abs(el.x - p.x) < 13 && Math.abs(el.y - p.y) < 15) {
        el.preso = true;
        prendi(el);
      }
    });

    /* ── i punti di controllo: la domanda ─────────────────────────────── */
    liv.controlli.forEach(function (c) {
      if (c.fatto) return;
      if (p.x >= c.x) {
        c.fatto = true;
        apriDomanda();
      }
    });

    /* ── il boss ──────────────────────────────────────────────────────── */
    if (S.boss) {
      var bo = S.boss;
      if (!bo.attivo && p.x > bo.x - LARGO * 0.6) {
        bo.attivo = true;
        bip(110, 0.4, 'sawtooth', 0.08);
      }
      if (bo.attivo) {
        bo.t++;
        if (bo.colpito > 0) bo.colpito--;
        /* seconda fase quando è a metà vita: si muove più in fretta */
        if (bo.vita <= bo.max / 2) bo.fase = 2;
        var vb = (bo.fase === 2 ? 1.5 : 0.9) * S.diff.vel;
        bo.x += Math.sin(bo.t / 48) * vb;
        bo.y = ALTO - 6 * TILE + Math.sin(bo.t / 30) * 14;
        if (Math.abs(bo.x - p.x) < 24 && Math.abs(bo.y - p.y) < 24) {
          if (S.invincibile > 0 || ab === 'invinc') { /* niente */ }
          else colpito();
        }
      }
    } else if (p.x > liv.largo - 40) {
      vinciLivello();
    }

    if (S.invincibile > 0) S.invincibile--;
    S.particelle.forEach(function (q) { q.x += q.vx; q.y += q.vy; q.vy += 0.2; q.t--; });
    S.particelle = S.particelle.filter(function (q) { return q.t > 0; });
    p.anim++;
  }

  function particelle(x, y, colore, n) {
    for (var i = 0; i < (n || 7); i++) {
      S.particelle.push({ x: x, y: y, vx: (Math.random() - 0.5) * 3,
                          vy: -Math.random() * 2.5, t: 16 + Math.random() * 12,
                          c: colore });
    }
  }

  function uccidi(e) {
    e.vivo = false;
    S.punti += 50 * S.moltiplicatore;
    particelle(e.x, e.y, '#ff79c6', 8);
    bip(300, 0.07, 'triangle', 0.05);
  }

  function prendi(el) {
    var d = datiElemento(el.sim);
    S.elemento = { sim: el.sim, ab: el.ab, nome: d ? d.nome : el.sim,
                   Z: d ? d.Z : null, nota: d ? d.nota : '' };
    if (el.ab === 'armatura') S.scudo = 2;
    else if (el.ab === 'scudo1') S.scudo = 1;
    else if (el.ab === 'scudo2') S.scudo = 1;
    else if (el.ab === 'invinc') S.invincibile = 300;
    S.moltiplicatore = (el.ab === 'doppio') ? 2 : 1;
    S.punti += 100;
    particelle(el.x, el.y, COLORI[el.ab] || '#fff', 12);
    bip(780, 0.12, 'triangle', 0.07);
    mostraAvviso(t('Sei diventato ', 'You became ') + (d ? d.nome : el.sim) +
                 (d && d.Z ? ' (Z ' + d.Z + ')' : ''), POTERI.filter(function (p) {
                   return p.ab === el.ab; })[0], d);
  }

  function colpito() {
    if (S.p.immune > 0) return;
    if (abilita() === 'schermo' && Math.random() < 0.5) { S.p.immune = 40; return; }
    if (S.scudo > 0) {
      S.scudo--;
      S.p.immune = 60;
      bip(200, 0.14, 'square', 0.07);
      if (abilita() === 'scudo2') setTimeout(function () { if (S) S.scudo = 1; }, 4000);
      return;
    }
    perdiVita(t('ti ha preso un nemico', 'an enemy got you'));
  }

  function perdiVita(perche) {
    S.vite--;
    S.elemento = null; S.scudo = 0; S.moltiplicatore = 1;
    bip(140, 0.3, 'sawtooth', 0.09);
    if (S.vite <= 0) {
      S.finito = { esito: 'perso', perche: perche };
      schermo = 'esito';
      disegnaUI();
      return;
    }
    caricaLivello(S.livello);
    S.p.immune = 80;
    mostraAvviso(t('Vita persa: ', 'Life lost: ') + perche, null, null);
  }

  function vinciLivello() {
    S.punti += 500 * S.moltiplicatore;
    bip(660, 0.1, 'triangle', 0.08);
    setTimeout(function () { bip(880, 0.18, 'triangle', 0.08); }, 110);
    if (S.livello >= LIVELLI) {
      S.finito = { esito: 'vinto' };
      schermo = 'esito';
      disegnaUI();
      return;
    }
    schermo = 'livello';
    caricaLivello(S.livello + 1);
    disegnaUI();
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL DISEGNO — rettangoli su una tela 480×270, ingrandita a numeri interi
     ═════════════════════════════════════════════════════════════════════════ */
  /* ═════════════════════════════════════════════════════════════════════════
     LA SCHERMATA DEL TITOLO, DISEGNATA

     Il nome del gioco sta nella TELA, non in un `<h1>` sopra: in un gioco
     retro il titolo fa parte del gioco, e un titolo in HTML sopra una tela a
     pixel si vede subito che e' un'altra cosa. Attorno al nome girano venti
     bollicine, una per ogni elemento che si puo' diventare, con il loro
     simbolo e il loro colore: il titolo dice che cos'e' il gioco senza
     scriverlo.
     ═════════════════════════════════════════════════════════════════════════ */
  var tTit = 0;

  function disegnaTitolo() {
    if (!ctx) return;
    tTit++;
    ctx.imageSmoothingEnabled = false;
    /* fondo: un bagliore che respira */
    var g = ctx.createRadialGradient(LARGO / 2, ALTO * 0.44, 10, LARGO / 2, ALTO * 0.44, 300);
    g.addColorStop(0, '#13385c');
    g.addColorStop(0.45, '#0a1c33');
    g.addColorStop(1, '#03090f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, LARGO, ALTO);
    /* stelle */
    for (var i = 0; i < 60; i++) {
      var sx = (i * 131) % LARGO, sy = (i * 71) % ALTO;
      var b = 0.12 + 0.2 * Math.abs(Math.sin((tTit + i * 29) / 40));
      ctx.fillStyle = 'rgba(255,255,255,' + b.toFixed(2) + ')';
      ctx.fillRect(sx, sy, 1, 1);
    }
    /* due orbitali inclinati, come nel marchio dell'applicazione */
    ctx.strokeStyle = 'rgba(94,234,212,.16)'; ctx.lineWidth = 1;
    for (var o2 = 0; o2 < 3; o2++) {
      ctx.save();
      ctx.translate(LARGO / 2, ALTO * 0.44);
      ctx.rotate((o2 * 60 + tTit / 6) * Math.PI / 180);
      ctx.beginPath(); ctx.ellipse(0, 0, 196, 58, 0, 0, 6.2832); ctx.stroke();
      ctx.restore();
    }
    /* le bollicine degli elementi, una per potere, in orbita */
    POTERI.forEach(function (p, k) {
      var a = (tTit / 150) + (k / POTERI.length) * 6.2832;
      var rx = 188, ry = 56;
      var x = LARGO / 2 + Math.cos(a) * rx;
      var y = ALTO * 0.44 + Math.sin(a) * ry;
      var dietro = Math.sin(a) < 0;
      var r = dietro ? 5 : 7;
      ctx.globalAlpha = dietro ? 0.45 : 1;
      ctx.fillStyle = COLORI[p.ab] || '#fff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      if (!dietro) {
        ctx.fillStyle = '#04101e';
        ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
        ctx.fillText(p.sim, x, y + 2.5);
      }
      ctx.globalAlpha = 1;
    });
    /* IL NOME */
    var k1 = 5;
    var larg = largoTesto(NOME, k1);
    while (larg > LARGO - 28 && k1 > 2) { k1--; larg = largoTesto(NOME, k1); }
    var yN = Math.round(ALTO * 0.44 - 7 * k1 / 2);
    /* un alone, poi l'ombra, poi le lettere: a cinque pixel per modulo
       l'alone e' l'unico modo di far staccare il titolo dagli orbitali */
    ctx.save();
    ctx.shadowColor = 'rgba(94,234,212,.55)'; ctx.shadowBlur = 18;
    scriviCentrato(NOME, yN, k1, '#eafffb', 'rgba(3,12,20,.85)');
    ctx.restore();
    scriviCentrato(NOME, yN, k1, '#eafffb', 'rgba(3,12,20,.85)');
    /* il sottotitolo */
    scriviCentrato(t('LA CORSA DEGLI ELEMENTI', 'THE ELEMENT RUN'),
                   yN + 7 * k1 + 12, 2, '#9fe8da', 'rgba(3,12,20,.7)');
    /* che cos'è questo gioco, in una riga. Sta QUI, sotto il sottotitolo, e
       non in fondo: il terzo inferiore della tela è occupato dai due pulsanti
       veri, e un testo disegnato lì sotto ci finisce dietro — misurato in una
       finestra da telefono. Non c'è nemmeno un «PREMI GIOCA» che lampeggia:
       il pulsante GIOCA è lì sotto e dice già la stessa cosa. */
    scriviCentrato(LIVELLI + ' ' + t('LIVELLI', 'LEVELS') + ' · 4 BOSS · ' +
                   POTERI.length + ' ' + t('ELEMENTI', 'ELEMENTS'),
                   yN + 7 * k1 + 32, 1, '#9ab4cc', 'rgba(3,12,20,.9)');
  }

  function disegna() {
    if (!ctx) return;
    /* sul titolo si disegna il titolo: e' una schermata del gioco, non una
       pagina HTML travestita */
    if (schermo === 'titolo') { disegnaTitolo(); return; }
    var liv = S && S.liv;
    ctx.imageSmoothingEnabled = false;
    /* cielo: due fasce, la zona cambia colore */
    var zona = liv ? liv.zona : 1;
    var cieli = [['#0b1d3a', '#13325c'], ['#1a0f2e', '#3a1f52'],
                 ['#2a1206', '#5a2a10'], ['#04161a', '#0a3a3a']];
    var c1 = cieli[(zona - 1) % 4][0], c2 = cieli[(zona - 1) % 4][1];
    var g = ctx.createLinearGradient(0, 0, 0, ALTO);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, LARGO, ALTO);
    if (!liv) return;

    /* stelle fisse: un fondo che non si muove dà profondità a costo zero */
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    for (var i = 0; i < 40; i++) {
      var sx = (i * 97) % LARGO, sy = (i * 61) % (ALTO - 90);
      ctx.fillRect(sx, sy, 1, 1);
    }

    var cam = Math.round(S.cam);
    var da = Math.floor(cam / TILE) - 1, a = da + Math.ceil(LARGO / TILE) + 2;

    /* terreno */
    for (var c = Math.max(0, da); c < Math.min(liv.mappa.length, a); c++) {
      var m = liv.mappa[c];
      var x = c * TILE - cam;
      if (!m.vuoto) {
        var y = ALTO - m.h * TILE;
        ctx.fillStyle = ['#2d4a2d', '#3a2d4a', '#4a3a2d', '#2d4a4a'][(zona - 1) % 4];
        ctx.fillRect(x, y, TILE, ALTO - y);
        ctx.fillStyle = ['#4a7a4a', '#5f4a7a', '#7a5f3a', '#3a7a7a'][(zona - 1) % 4];
        ctx.fillRect(x, y, TILE, 3);
      }
      if (m.piattaforma) {
        var yp = ALTO - m.piattaforma * TILE;
        ctx.fillStyle = '#6b7a8a'; ctx.fillRect(x, yp, TILE, 4);
        ctx.fillStyle = '#95a7b8'; ctx.fillRect(x, yp, TILE, 1);
      }
      if (m.blocco) {
        var yb = ALTO - (m.h + 2) * TILE;
        ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + 1, yb, TILE - 2, TILE - 2);
        ctx.fillStyle = '#c0a060'; ctx.fillRect(x + 2, yb + 1, TILE - 4, 2);
      }
    }

    /* punti di controllo */
    liv.controlli.forEach(function (ck) {
      var x = ck.x - cam;
      if (x < -20 || x > LARGO + 20) return;
      ctx.fillStyle = ck.fatto ? '#5eead4' : '#ffd93d';
      ctx.fillRect(x, ALTO - 150, 2, 150);
      ctx.fillRect(x, ALTO - 150, 14, 9);
    });

    /* elementi */
    liv.elementi.forEach(function (el) {
      if (el.preso) return;
      var x = el.x - cam;
      if (x < -24 || x > LARGO + 24) return;
      var y = el.y + Math.sin(el.t / 18) * 3;
      ctx.fillStyle = COLORI[el.ab] || '#fff';
      ctx.beginPath(); ctx.arc(x + 6, y + 6, 8, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#06131f';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(el.sim, x + 6, y + 9.5);
    });

    /* nemici */
    liv.nemici.forEach(function (e) {
      if (!e.vivo) return;
      var x = e.x - cam;
      if (x < -20 || x > LARGO + 20) return;
      ctx.fillStyle = e.ossidante ? '#ff5f7e' : '#b06bff';
      ctx.fillRect(x - 6, e.y - 6, 12, 12);
      ctx.fillStyle = '#06131f';
      ctx.fillRect(x - 3, e.y - 3, 2, 2);
      ctx.fillRect(x + 1, e.y - 3, 2, 2);
      if (e.tipo === 'vola') {
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.fillRect(x - 10, e.y - 1, 4, 2); ctx.fillRect(x + 6, e.y - 1, 4, 2);
      }
    });

    /* proiettili */
    ctx.fillStyle = '#ffe066';
    S.proiettili.forEach(function (b) {
      ctx.fillRect(b.x - cam - 2, b.y - 1, 5, 2);
    });

    /* boss */
    if (S.boss && S.boss.attivo) {
      var bo = S.boss, bx = bo.x - cam;
      ctx.fillStyle = bo.colpito > 0 ? '#ffffff' : (S.liv.finale ? '#ff3b5c' : '#c44bff');
      ctx.fillRect(bx - 17, bo.y - 17, 34, 34);
      ctx.fillStyle = '#06131f';
      ctx.fillRect(bx - 9, bo.y - 7, 5, 5); ctx.fillRect(bx + 4, bo.y - 7, 5, 5);
      ctx.fillRect(bx - 8, bo.y + 5, 16, 3);
      /* la sua vita */
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(LARGO / 2 - 60, 10, 120, 7);
      ctx.fillStyle = '#ff5f7e';
      ctx.fillRect(LARGO / 2 - 59, 11, 118 * Math.max(0, bo.vita / bo.max), 5);
    }

    /* particelle */
    S.particelle.forEach(function (q) {
      ctx.fillStyle = q.c; ctx.fillRect(q.x - cam, q.y, 2, 2);
    });

    /* il giocatore: prende il colore dell'elemento e ne porta il simbolo */
    var p = S.p, px = p.x - cam;
    var col = S.elemento ? (COLORI[S.elemento.ab] || '#8be9fd') : '#e8f4ff';
    if (!(p.immune > 0 && Math.floor(p.immune / 4) % 2)) {
      if (S.invincibile > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(p.anim / 3)) + ')';
        ctx.fillRect(px - 9, p.y - 11, 18, 22);
      }
      ctx.fillStyle = col;
      ctx.fillRect(px - 5, p.y - 7, 11, 14);
      ctx.fillStyle = '#06131f';
      ctx.fillRect(px + (p.guarda > 0 ? 1 : -4), p.y - 4, 3, 3);
      if (S.elemento) {
        ctx.fillStyle = '#06131f';
        ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
        ctx.fillText(S.elemento.sim, px, p.y + 5);
      }
      if (S.scudo > 0) {
        ctx.strokeStyle = '#8be9fd'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, p.y, 12, 0, 6.2832); ctx.stroke();
      }
    }

    /* HUD */
    ctx.fillStyle = 'rgba(4,12,22,.72)'; ctx.fillRect(0, 0, LARGO, 20);
    ctx.fillStyle = '#eaf6ff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('♥'.repeat(Math.max(0, S.vite)), 6, 14);
    ctx.textAlign = 'center';
    ctx.fillText(t('ZONA ', 'ZONE ') + S.liv.zona + ' · ' + t('LIV ', 'LVL ') +
                 S.livello + '/' + LIVELLI, LARGO / 2, 14);
    ctx.textAlign = 'right';
    ctx.fillText(String(S.punti).padStart(6, '0') +
                 (S.moltiplicatore > 1 ? ' ×' + S.moltiplicatore : ''), LARGO - 6, 14);
    if (S.elemento) {
      ctx.fillStyle = col; ctx.textAlign = 'left';
      ctx.fillText(S.elemento.sim + ' ' + S.elemento.nome, 6, ALTO - 6);
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL CICLO — passo fisso, e si ferma se la sezione non si vede
     ═════════════════════════════════════════════════════════════════════════ */
  function visibile() {
    var s = document.getElementById(ID);
    return !!(s && getComputedStyle(s).display !== 'none');
  }

  function ciclo(ora) {
    anim = null;
    if (!tela || !visibile()) { ultimo = 0; return; }   /* fermo: niente batteria */
    if (!ultimo) ultimo = ora;
    var dt = Math.min(ora - ultimo, 200);
    ultimo = ora;
    accumulo += dt;
    var giri = 0;
    /* `passo()` avanza la FISICA, e si fa solo in partita; il disegno invece
       gira anche sul titolo, che è animato. Il ciclo resta uno. */
    while (accumulo >= PASSO && giri < 5) { passo(); accumulo -= PASSO; giri++; }
    disegna();
    anim = requestAnimationFrame(ciclo);
  }

  function avviaCiclo() {
    if (anim) return;
    ultimo = 0; accumulo = 0;
    anim = requestAnimationFrame(ciclo);
  }
  function fermaCiclo() {
    if (anim) { cancelAnimationFrame(anim); anim = null; }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LA DOMANDA AL PUNTO DI CONTROLLO
     ═════════════════════════════════════════════════════════════════════════ */
  var domandaCorrente = null, timerDomanda = null, restano = 0;

  function apriDomanda() {
    var D = globale.BSIGiocoDomande;
    if (!D) return;
    var q = D.domanda(S.diff.livDomanda);
    if (!q) return;
    domandaCorrente = q;
    schermo = 'domanda';
    fermaCiclo();
    restano = S.diff.tempo;
    disegnaUI();
    if (restano > 0) {
      timerDomanda = setInterval(function () {
        restano--;
        var e = document.getElementById('bsiG-tempo');
        if (e) e.textContent = restano + 's';
        if (restano <= 0) rispondi(null);
      }, 1000);
    }
    bip(520, 0.12, 'triangle', 0.06);
  }

  function rispondi(scelta) {
    if (timerDomanda) { clearInterval(timerDomanda); timerDomanda = null; }
    var q = domandaCorrente;
    if (!q) return;
    var giusto = scelta === q.giusta;
    if (giusto) {
      S.risposteGiuste++;
      S.punti += 300 * S.moltiplicatore;
      bip(880, 0.12, 'triangle', 0.08);
    } else {
      S.risposteSbagliate++;
      bip(160, 0.25, 'sawtooth', 0.08);
    }
    schermo = 'esitoDomanda';
    domandaCorrente = Object.assign({}, q, { scelta: scelta, giusto: giusto });
    disegnaUI();
  }

  function chiudiDomanda() {
    var q = domandaCorrente;
    domandaCorrente = null;
    schermo = 'gioco';
    /* alle difficoltà da «reazione esotermica» in su, sbagliare costa */
    if (q && !q.giusto && S.diff.sbaglioCosta) {
      if (S.elemento) {
        S.elemento = null; S.scudo = 0; S.moltiplicatore = 1;
        mostraAvviso(t('Risposta sbagliata: hai perso l’elemento.',
                       'Wrong answer: you lost the element.'), null, null);
      } else {
        perdiVita(t('risposta sbagliata', 'wrong answer'));
        return;
      }
    }
    disegnaUI();
    avviaCiclo();
  }

  /* ═════════════════════════════════════════════════════════════════════════
     L'INTERFACCIA
     ═════════════════════════════════════════════════════════════════════════ */
  function stile() {
    if (document.getElementById('bsiG-stile')) return;
    var s = document.createElement('style');
    s.id = 'bsiG-stile';
    s.textContent = [
      /* ── LA SCENA SI DIMENSIONA SULL'ALTEZZA, NON SOLO SULLA LARGHEZZA ──
         Misurato su un telefono: con `width:100%` e `height:auto` la tela, a
         schermo girato (844×390), diventava 808×455 — PIU' ALTA dello
         schermo — e i comandi finivano a 907 px su una finestra di 390,
         cioe' IRRAGGIUNGIBILI. Girare il telefono rendeva il gioco
         ingiocabile.
         Qui la larghezza e' la minore fra «tutto lo spazio» e «quella che
         l'altezza disponibile consente», quindi la scena rimpicciolisce
         invece di sfondare il bordo inferiore. `dvh` perche' su telefono la
         barra del browser entra e esce e `vh` non la conta. */
      '#bsiG-scena{position:relative;margin:0 auto;aspect-ratio:480/270;',
      ' width:min(100%,calc((100vh - 230px) * 480 / 270));',
      ' width:min(100%,calc((100dvh - 230px) * 480 / 270));',
      ' background:#04101e;border:2px solid #1e3a52;border-radius:10px;overflow:hidden}',
      '#bsiG-tela{display:block;width:100%;height:100%;image-rendering:pixelated}',
      /* ── SCHERMO PIENO, FATTO A MANO ───────────────────────────────────
         Non con l'API Fullscreen: su telefono non e' concessa a un elemento
         qualunque in tutti i browser, e un gioco che a volte va a schermo
         pieno e a volte no e' peggio di uno che non ci va mai. Qui e' una
         classe sul `body`: funziona sempre, e la vera API si chiede in piu'
         quando c'e'. */
      'body.bsiG-pieno #bsiG-scena{position:fixed;inset:0;width:100vw;',
      ' height:100dvh;max-width:none;aspect-ratio:auto;border:0;border-radius:0;',
      ' z-index:9998;background:#02080f}',
      'body.bsiG-pieno #bsiG-tela{width:100%;height:100%;object-fit:contain}',
      'body.bsiG-pieno #bsiG-comandi{position:fixed;left:10px;right:10px;',
      ' bottom:max(14px,env(safe-area-inset-bottom));z-index:9999;margin:0}',
      'body.bsiG-pieno{overflow:hidden}',
      '#bsiG-pieno{position:absolute;top:8px;right:8px;z-index:30;width:34px;',
      ' height:34px;border-radius:9px;border:1px solid #2f5f82;color:#cfe2f5;',
      ' background:rgba(4,12,22,.72);font-size:15px;cursor:pointer;padding:0;',
      ' display:flex;align-items:center;justify-content:center}',
      '#bsiG-pieno:hover,#bsiG-pieno:focus-visible{border-color:#5eead4;outline:none}',
      '#bsiG-ui{position:absolute;inset:0;display:flex;align-items:center;',
      ' justify-content:center;padding:14px;box-sizing:border-box;pointer-events:none}',
      /* PERCHE' LA SEZIONE DEL GIOCO NON PUO' AVERE UNA TRASFORMAZIONE.
         L'applicazione anima l'apertura di ogni sezione con uno spostamento
         (`transform:translateY`) e con `will-change:opacity,transform`. Un
         elemento con una trasformazione diventa il riferimento dei figli
         `position:fixed`: dentro una sezione così, `fixed; inset:0` non è più
         lo schermo, è la sezione. Misurato: il pannello dei menù risultava
         812×427 a partire da y=−10 su una finestra 844×390, e tre pulsanti
         restavano fuori. Qui si toglie la trasformazione alla sola sezione del
         gioco — l'apertura sfuma lo stesso, ma in opacità — perché questa
         sezione contiene cose che devono ancorarsi alla finestra: il pannello
         dei menù, la scena a schermo pieno e i comandi.

         Si toglie anche l'animazione in opacità, e non per gusto: un'animazione
         che anima l'opacità, con `fill-mode: both`, lascia la sezione in stato
         «riempito» per sempre, e un elemento in quello stato è un contesto di
         impilamento con z-index automatico. Dentro un contesto così il nostro
         `z-index:10000` non vale più niente fuori: misurato, la barra di
         navigazione (z-index 90) finiva SOPRA il menù di pausa, e il pulsante
         «riprendi» non si poteva premere perché sotto il dito c'era una
         linguetta della barra. La sezione del gioco compare quindi senza
         dissolvenza: meglio senza un effetto che con un menù che non si tocca. */
      '#' + ID + '{will-change:auto}',
      '#' + ID + '.on{animation:none}',
      /* QUANDO C'E' UN MENU' L'INGOMBRO E' LO SCHERMO, NON LA SCENA.
         La scena è alta quanto 270/480 della sua larghezza: su un telefono in
         verticale sono circa 220 px, e dentro 220 px un menù con la guida, le
         quattordici lingue e le impostazioni non ci sta — misurato: diciassette
         pulsanti su diciannove finivano fuori, e girando il telefono anche
         «riprendi». Un pulsante che non si riesce a toccare non c'è. Perciò il
         pannello dei menù (e solo quello: in partita resta trasparente sopra la
         scena) si àncora alla finestra e scorre dentro di sé. Vale per tutti i
         menù — difficoltà, domanda, esito, pausa — non solo per la pausa. */
      '#bsiG-ui.attiva{pointer-events:auto;background:rgba(4,12,22,.92);',
      ' position:fixed;inset:0;z-index:10000;align-items:center;',
      ' padding:max(10px,env(safe-area-inset-top)) 12px ',
      ' max(10px,env(safe-area-inset-bottom))}',
      '#bsiG-ui.attiva .bsiG-scheda{max-height:100%;overflow:auto;',
      ' -webkit-overflow-scrolling:touch;overscroll-behavior:contain}',
      '.bsiG-stato{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;',
      ' font-size:12px;color:#b9d3e6;margin:6px 0 12px}',
      '.bsiG-stato span{background:rgba(94,234,212,.08);border:1px solid ',
      ' rgba(94,234,212,.18);border-radius:999px;padding:3px 9px}',
      '.bsiG-etic{font-size:11px;letter-spacing:.14em;text-transform:uppercase;',
      ' color:#6f8aa3;margin:12px 0 6px}',
      '.bsiG-bandiere{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
      '.bsiG-fl{width:38px;height:38px;border-radius:50%;font-size:17px;line-height:1;',
      ' cursor:pointer;background:rgba(10,22,40,.9);color:#eaf6ff;padding:0;',
      ' border:1.5px solid rgba(94,234,212,.28);transition:transform .15s}',
      '.bsiG-fl:hover,.bsiG-fl:focus-visible{transform:scale(1.12);outline:none;',
      ' border-color:#5eead4}',
      '.bsiG-fl.on{border-color:#5eead4;background:rgba(94,234,212,.18);',
      ' box-shadow:0 0 0 2px rgba(94,234,212,.22)}',
      '.bsiG-scheda{max-width:420px;width:100%;text-align:center;color:#eaf6ff;',
      ' font-family:ui-monospace,monospace}',
      '.bsiG-tit{font-size:17px;font-weight:800;color:#5eead4;margin:0 0 6px;',
      ' letter-spacing:.04em;line-height:1.3}',
      '.bsiG-sub{font-size:11.5px;color:#cfe2f5;line-height:1.6;margin:0 0 12px}',
      '.bsiG-b{display:inline-block;margin:4px;padding:9px 16px;border-radius:8px;',
      ' border:1.5px solid #5eead4;background:rgba(94,234,212,.14);color:#eafffb;',
      ' font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
      '.bsiG-b:hover,.bsiG-b:focus-visible{background:rgba(94,234,212,.3);outline:none}',
      '.bsiG-b2{border-color:#7c6fff;background:rgba(124,111,255,.15);color:#e8e4ff}',
      '.bsiG-b2:hover,.bsiG-b2:focus-visible{background:rgba(124,111,255,.3)}',
      '.bsiG-dif{display:block;width:100%;margin:5px 0;padding:9px 12px;text-align:left;',
      ' border-radius:9px;border:1.5px solid #1e3a52;background:#0a1628;color:#eaf6ff;',
      ' font-family:inherit;cursor:pointer}',
      '.bsiG-dif:hover,.bsiG-dif:focus-visible{border-color:#5eead4;outline:none}',
      '.bsiG-dif b{color:#5eead4;font-size:12.5px}',
      '.bsiG-dif span{display:block;font-size:10.5px;color:#9fb3c8;margin-top:2px}',
      '.bsiG-op{display:block;width:100%;margin:4px 0;padding:9px 11px;text-align:left;',
      ' border-radius:8px;border:1.5px solid #1e3a52;background:#0a1628;color:#eaf6ff;',
      ' font-family:inherit;font-size:12px;cursor:pointer;line-height:1.4}',
      '.bsiG-op:hover,.bsiG-op:focus-visible{border-color:#5eead4;outline:none}',
      '.bsiG-op.giusta{border-color:#5eead4;background:rgba(94,234,212,.2)}',
      '.bsiG-op.sbagliata{border-color:#ff6b84;background:rgba(255,107,132,.16)}',
      /* i comandi: grandi, perché su un telefono si gioca col pollice */
      '#bsiG-comandi{display:flex;justify-content:space-between;align-items:center;',
      ' gap:10px;margin-top:10px;user-select:none;-webkit-user-select:none}',
      '.bsiG-pad{display:flex;gap:8px}',
      '.bsiG-t{width:56px;height:56px;border-radius:14px;border:2px solid #2f5f82;',
      ' background:linear-gradient(180deg,#13273e,#0a1628);color:#cfe2f5;font-size:20px;',
      ' font-weight:800;cursor:pointer;touch-action:none;display:flex;',
      ' align-items:center;justify-content:center;font-family:inherit}',
      '.bsiG-t:active,.bsiG-t.giu{background:linear-gradient(180deg,#1d3d5e,#13273e);',
      ' border-color:#5eead4;color:#eafffb}',
      '.bsiG-t.az{border-color:#7c6fff;color:#e8e4ff}',
      '.bsiG-t.az:active,.bsiG-t.az.giu{border-color:#b8a6ff}',
      '#bsiG-avviso{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;',
      ' background:rgba(4,12,22,.9);border:1px solid #2f5f82;border-radius:9px;',
      ' padding:7px 12px;color:#eaf6ff;font-family:ui-monospace,monospace;',
      ' font-size:11px;max-width:88%;text-align:center;line-height:1.45;',
      ' opacity:0;transition:opacity .25s;pointer-events:none}',
      '#bsiG-avviso.on{opacity:1}',
      '.bsiG-prov{font-size:10px;color:#9fb3c8;margin-top:8px;line-height:1.5}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── DOVE SI ATTACCA UNA SEZIONE NUOVA ────────────────────────────────
     Non accanto a una sezione qualunque: accanto a una di PRIMO LIVELLO.
     `bsi-centrospettri.js` SPOSTA dieci pannelli dentro il proprio corpo, e
     fra questi `sspettrolettore`. Ancorandosi a lui — come faceva la prima
     stesura — la sezione nuova finiva DENTRO il corpo del centro, cioe'
     dentro un contenitore nascosto: il suo `display` diceva `block` e lei
     non si vedeva, perche' un antenato era `display:none`.
     E' il difetto che ha reso invisibile la sezione «Articoli» per una
     versione intera. Il controllo che l'aveva lasciata passare guardava
     `getComputedStyle(sezione).display !== 'none'`, che NON risponde alla
     domanda «si vede?»: la risposta e' un riquadro di dimensione non nulla.
     Qui si cerca una sezione che non sia annidata in un'altra. */
  function ancora() {
    var tutte = document.querySelectorAll('.section');
    for (var i = 0; i < tutte.length; i++) {
      var s = tutte[i];
      if (!s.parentElement) continue;
      if (s.parentElement.closest && s.parentElement.closest('.section')) continue;
      return s;
    }
    return null;
  }

  function costruisci() {
    if (document.getElementById(ID)) return document.getElementById(ID);
    var rif = ancora();
    if (!rif || !rif.parentNode) return null;
    var d = document.createElement('div');
    d.id = ID;
    d.className = 'section';
    d.innerHTML =
      '<div class="section-title">🎮 ' + NOME + ' — ' +
        t('LA CORSA DEGLI ELEMENTI', 'THE ELEMENT RUN') + '</div>' +
      '<div id="bsiG-intro" style="color:#9fb3c8;font-size:.9rem;margin-bottom:12px;' +
        'max-width:860px;line-height:1.65"></div>' +
      '<div id="bsiG-scena">' +
        '<canvas id="bsiG-tela" width="' + LARGO + '" height="' + ALTO + '" ' +
          'aria-label="' + t('Area di gioco', 'Game area') + '"></canvas>' +
        '<div id="bsiG-ui"></div>' +
        '<div id="bsiG-avviso"></div>' +
        '<button id="bsiG-pieno" aria-label="' +
          t('schermo pieno', 'full screen') + '">⛶</button>' +
      '</div>' +
      '<div id="bsiG-comandi"></div>' +
      '<div id="bsiG-sotto" style="margin-top:12px"></div>';
    rif.parentNode.insertBefore(d, rif.nextSibling);
    return d;
  }

  function intro() {
    var i = document.getElementById('bsiG-intro');
    if (!i) return;
    i.innerHTML = t(
      'Un platform retro in cui i potenziamenti sono <b>elementi della tavola ' +
      'periodica</b>: ognuno ti trasforma e ti dà un’abilità che viene dalla sua ' +
      'chimica. Dodici livelli, quattro zone, un boss alla fine di ogni zona. Ai ' +
      '<b>punti di controllo</b> arriva una domanda di chimica — generata dalle ' +
      'tabelle di questa applicazione, non scritta a mano — e la difficoltà che ' +
      'scegli decide <i>quali</i> domande arrivano. Il tasto <b>❚❚</b> (o <b>Esc</b>) ' +
      'apre la pausa: lì dentro ci sono la guida, il cambio lingua, il suono e lo ' +
      'schermo pieno. Funziona anche <b>offline</b>: non c’è niente da scaricare.',
      'A retro platformer where the power-ups are <b>periodic table elements</b>: ' +
      'each one transforms you and grants an ability that comes from its chemistry. ' +
      'Twelve levels, four zones, a boss at the end of each zone. At the ' +
      '<b>checkpoints</b> a chemistry question arrives — generated from this ' +
      'application’s own tables, not hand-written — and the difficulty you pick ' +
      'decides <i>which</i> questions come. The <b>❚❚</b> key (or <b>Esc</b>) opens ' +
      'the pause menu: the guide, the language switch, the sound and full screen are ' +
      'in there. It works <b>offline</b> too: there is nothing to download.');
  }

  function mostraAvviso(testo, potere, dati) {
    var a = document.getElementById('bsiG-avviso');
    if (!a) return;
    var extra = '';
    if (potere) extra = '<br><span style="color:#9fe8da">' + esc(potere.perche) + '</span>';
    else if (dati && dati.nota) extra = '<br><span style="color:#9fb3c8">' +
      esc(String(dati.nota).slice(0, 90)) + '</span>';
    a.innerHTML = esc(testo) + extra;
    a.classList.add('on');
    clearTimeout(a._t);
    a._t = setTimeout(function () { a.classList.remove('on'); }, 2600);
  }

  function ui() { return document.getElementById('bsiG-ui'); }

  /* LA GUIDA STA IN UNA FUNZIONE SOLA perché si legge da due posti: dal
     titolo («come si gioca») e dal menù di pausa. Due copie dello stesso
     testo sono due testi che un giorno diranno cose diverse. */
  function guida() {
    return t(
          '<b>◀ ▶</b> muovono · <b>⤒</b> salta (tienilo premuto per saltare più alto) · ' +
          '<b>✦</b> usa l’abilità dell’elemento.<br>' +
          'Da tastiera: <b>frecce</b> o <b>A/D</b>, <b>spazio</b> salta, <b>K</b> agisce.<br><br>' +
          'Saltare <b>sopra</b> un nemico lo schiaccia. Sparare funziona solo se ' +
          'l’elemento che hai lo permette — l’ossigeno ossida, il fluoro è il più ' +
          'elettronegativo e colpisce più forte, il carbonio ha quattro legami e ' +
          'quindi quattro colpi.<br><br>' +
          'Ai <b>punti di controllo</b> (le bandierine) arriva una domanda. Da ' +
          '«reazione esotermica» in su, sbagliare costa l’elemento — o una vita se ' +
          'non ne hai.',
          '<b>◀ ▶</b> move · <b>⤒</b> jump (hold it to jump higher) · ' +
          '<b>✦</b> uses the element’s ability.<br>' +
          'Keyboard: <b>arrows</b> or <b>A/D</b>, <b>space</b> jumps, <b>K</b> acts.<br><br>' +
          'Jumping <b>on</b> an enemy squashes it. Shooting only works if the element ' +
          'you carry allows it — oxygen oxidises, fluorine is the most electronegative ' +
          'and hits hardest, carbon has four bonds and therefore four shots.<br><br>' +
          'At the <b>checkpoints</b> (the flags) a question arrives. From "exothermic ' +
          'reaction" upwards, a wrong answer costs the element — or a life if you have ' +
          'none.');
  }

  function disegnaUI() {
    var u = ui();
    if (!u) return;
    u.className = (schermo === 'gioco') ? '' : 'attiva';
    if (schermo === 'gioco') { u.innerHTML = ''; comandi(); return; }

    if (schermo === 'titolo') {
      /* IL NOME NON SI RIPETE QUI: sta nella grafica, disegnato sulla tela.
         Scriverlo anche in HTML sarebbe lo stesso titolo due volte — e in
         questo progetto le cose doppie si tolgono. Il pannello resta
         trasparente, così il titolo disegnato si vede, e porta solo i
         pulsanti, che devono essere veri pulsanti per la tastiera e per un
         lettore di schermo. */
      u.className = '';
      u.innerHTML = '<div class="bsiG-scheda" style="align-self:flex-end;' +
        'margin-bottom:6px;pointer-events:auto">' +
        '<button class="bsiG-b" id="bsiG-gioca">▶ ' + t('GIOCA', 'PLAY') + '</button>' +
        '<button class="bsiG-b bsiG-b2" id="bsiG-comeSi">' +
          t('come si gioca', 'how to play') + '</button></div>';
      document.getElementById('bsiG-gioca').onclick = function () {
        schermo = 'difficolta'; disegnaUI();
      };
      document.getElementById('bsiG-comeSi').onclick = function () {
        schermo = 'aiuto'; disegnaUI();
      };
      return;
    }

    if (schermo === 'aiuto') {
      u.innerHTML = '<div class="bsiG-scheda" style="text-align:left">' +
        '<div class="bsiG-tit">' + t('Come si gioca', 'How to play') + '</div>' +
        '<div class="bsiG-sub">' + guida() + '</div>' +
        '<div style="text-align:center"><button class="bsiG-b" id="bsiG-indietro">' +
          t('indietro', 'back') + '</button></div></div>';
      document.getElementById('bsiG-indietro').onclick = function () {
        schermo = 'titolo'; disegnaUI();
      };
      return;
    }

    if (schermo === 'difficolta') {
      var h = '<div class="bsiG-scheda"><div class="bsiG-tit">' +
        t('Scegli la difficoltà', 'Choose the difficulty') + '</div>';
      DIFFICOLTA().forEach(function (d) {
        h += '<button class="bsiG-dif" data-bsi-dif="' + d.n + '">' +
          '<b>' + esc(d.nome) + '</b><span>' + esc(d.sotto) + ' · ' +
          d.vite + (d.vite === 1 ? t(' vita', ' life') : t(' vite', ' lives')) +
          ' · ' + t('domande di livello ', 'level ') + d.livDomanda +
          (d.tempo ? ' · ' + d.tempo + 's' : '') + '</span></button>';
      });
      h += '</div>';
      u.innerHTML = h;
      [].forEach.call(u.querySelectorAll('[data-bsi-dif]'), function (b) {
        b.onclick = function () {
          nuovaPartita(+b.getAttribute('data-bsi-dif'));
          schermo = 'livello';
          disegnaUI();
        };
      });
      return;
    }

    if (schermo === 'livello') {
      u.innerHTML = '<div class="bsiG-scheda">' +
        '<div class="bsiG-tit">' + t('ZONA ', 'ZONE ') + S.liv.zona +
          ' · ' + t('LIVELLO ', 'LEVEL ') + S.livello + '/' + LIVELLI + '</div>' +
        '<div class="bsiG-sub">' +
          (S.liv.boss ? (S.liv.finale
            ? t('<b>BOSS FINALE</b> — oltre questo non c’è niente.',
                '<b>FINAL BOSS</b> — there is nothing beyond this.')
            : t('<b>Fine della zona: c’è un boss.</b> Troverai un elemento che spara ' +
                'prima dell’arena.',
                '<b>End of the zone: there is a boss.</b> You will find a shooting ' +
                'element before the arena.'))
            : t('Corri, raccogli, rispondi.', 'Run, collect, answer.')) +
          '<br>' + esc(S.diff.nome) + ' · ♥ ' + S.vite + '</div>' +
        '<button class="bsiG-b" id="bsiG-via">' + t('VIA', 'GO') + '</button></div>';
      document.getElementById('bsiG-via').onclick = function () {
        schermo = 'gioco';
        if (!pienoSeServe()) inVista();
        disegnaUI(); avviaCiclo();
      };
      return;
    }

    if (schermo === 'domanda' && domandaCorrente) {
      var q = domandaCorrente;
      var hh = '<div class="bsiG-scheda" style="text-align:left">' +
        '<div class="bsiG-tit">' + t('PUNTO DI CONTROLLO', 'CHECKPOINT') +
        (S.diff.tempo ? ' · <span id="bsiG-tempo">' + restano + 's</span>' : '') +
        '</div><div class="bsiG-sub" style="color:#9fe8da">' + esc(q.area) + '</div>' +
        '<div class="bsiG-sub" style="font-size:12.5px;color:#eaf6ff">' +
          esc(q.domanda) + '</div>';
      q.opzioni.forEach(function (o, i) {
        hh += '<button class="bsiG-op" data-bsi-op="' + i + '">' + esc(o) + '</button>';
      });
      hh += '</div>';
      u.innerHTML = hh;
      [].forEach.call(u.querySelectorAll('[data-bsi-op]'), function (b) {
        b.onclick = function () {
          rispondi(q.opzioni[+b.getAttribute('data-bsi-op')]);
        };
      });
      return;
    }

    if (schermo === 'esitoDomanda' && domandaCorrente) {
      var r = domandaCorrente;
      var h2 = '<div class="bsiG-scheda" style="text-align:left">' +
        '<div class="bsiG-tit" style="color:' + (r.giusto ? '#5eead4' : '#ff8fa3') + '">' +
          (r.giusto ? t('GIUSTO', 'CORRECT') : t('SBAGLIATO', 'WRONG')) + '</div>';
      r.opzioni.forEach(function (o) {
        var cl = (o === r.giusta) ? ' giusta' : ((o === r.scelta) ? ' sbagliata' : '');
        h2 += '<div class="bsiG-op' + cl + '">' + esc(o) + '</div>';
      });
      h2 += '<div class="bsiG-sub" style="margin-top:10px;color:#eaf6ff">' +
          esc(r.spiega) + '</div>' +
        '<div class="bsiG-prov">' +
          t('da dove viene questa domanda: ', 'where this question comes from: ') +
          '<b>' + esc(r.provenienza) + '</b> — ' +
          t('una tabella di questa applicazione, non un elenco scritto per il gioco',
            'a table of this application, not a list written for the game') + '</div>' +
        '<div style="text-align:center;margin-top:8px">' +
        '<button class="bsiG-b" id="bsiG-avanti">' + t('avanti', 'continue') +
        '</button></div></div>';
      u.innerHTML = h2;
      document.getElementById('bsiG-avanti').onclick = chiudiDomanda;
      return;
    }

    if (schermo === 'esito') {
      var vinto = S.finito && S.finito.esito === 'vinto';
      var tot = S.risposteGiuste + S.risposteSbagliate;
      u.innerHTML = '<div class="bsiG-scheda">' +
        '<div class="bsiG-tit" style="color:' + (vinto ? '#5eead4' : '#ff8fa3') + '">' +
          (vinto ? t('HAI FINITO IL GIOCO', 'YOU FINISHED THE GAME')
                 : t('PARTITA FINITA', 'GAME OVER')) + '</div>' +
        '<div class="bsiG-sub">' +
          (vinto ? '' : esc(S.finito && S.finito.perche || '') + '<br>') +
          t('punti', 'score') + ': <b>' + S.punti + '</b><br>' +
          t('arrivato al livello', 'reached level') + ' <b>' + S.livello + '/' + LIVELLI + '</b><br>' +
          t('risposte', 'answers') + ': <b>' + S.risposteGiuste + '/' + tot + '</b>' +
          (tot ? ' (' + Math.round(S.risposteGiuste / tot * 100) + '%)' : '') +
          '<br>' + esc(S.diff.nome) + '</div>' +
        '<button class="bsiG-b" id="bsiG-ancora">' + t('ancora', 'again') + '</button>' +
        '<button class="bsiG-b bsiG-b2" id="bsiG-menu">' + t('menù', 'menu') +
        '</button></div>';
      document.getElementById('bsiG-ancora').onclick = function () {
        nuovaPartita(S.diff.n); schermo = 'livello'; disegnaUI();
      };
      document.getElementById('bsiG-menu').onclick = function () {
        schermo = 'titolo'; S = null; disegnaUI();
      };
      return;
    }

    u.innerHTML = '';
  }

  /* ── i comandi, grandi perché su un telefono si gioca col pollice ───── */
  function comandi() {
    var c = document.getElementById('bsiG-comandi');
    if (!c) return;
    if (c.getAttribute('data-bsi-pronti') === '1') return;
    c.setAttribute('data-bsi-pronti', '1');
    c.innerHTML =
      '<div class="bsiG-pad">' +
        '<button class="bsiG-t" data-bsi-tasto="sx" aria-label="' +
          t('sinistra', 'left') + '">◀</button>' +
        '<button class="bsiG-t" data-bsi-tasto="dx" aria-label="' +
          t('destra', 'right') + '">▶</button>' +
      '</div>' +
      '<button class="bsiG-t bsiG-b2" id="bsiG-pausa" aria-label="' +
        t('pausa', 'pause') + '" style="width:44px;height:44px;font-size:14px">❚❚</button>' +
      '<div class="bsiG-pad">' +
        '<button class="bsiG-t az" data-bsi-tasto="fuoco" aria-label="' +
          t('usa l’abilità dell’elemento', 'use the element ability') + '">✦</button>' +
        '<button class="bsiG-t" data-bsi-tasto="su" aria-label="' +
          t('salta', 'jump') + '">⤒</button>' +
      '</div>';
    /* L'ATTRIBUTO SI CHIAMA `data-bsi-tasto`, NON `data-bsi-t`, E C'E' UN
       MOTIVO. `data-bsi-t` e' gia' preso: `bsi-lingue.js` lo usa per marcare
       i nodi il cui TESTO va tradotto. Usandolo per dire «questo e' un tasto»
       i comandi del gioco (◀ ▶ ✦ ⤒) sono finiti nell'elenco delle stringhe da
       tradurre, e il banco delle lingue li ha segnalati come non tradotti in
       tutte e tredici le lingue. Non lo sono: sono SIMBOLI, e un simbolo non
       si traduce — quello che si traduce e' il loro nome accessibile, e quello
       e' tradotto. Due significati per lo stesso nome di attributo sono una
       collisione, e si risolve cambiando nome. */
    [].forEach.call(c.querySelectorAll('[data-bsi-tasto]'), function (b) {
      var k = b.getAttribute('data-bsi-tasto');
      function giu(e) { e.preventDefault(); tasti[k] = true; b.classList.add('giu'); }
      function su(e) { if (e) e.preventDefault(); tasti[k] = false; b.classList.remove('giu'); }
      b.addEventListener('pointerdown', giu);
      b.addEventListener('pointerup', su);
      b.addEventListener('pointercancel', su);
      b.addEventListener('pointerleave', su);
      /* senza questo, su certi telefoni un tasto resta premuto per sempre */
      b.addEventListener('lostpointercapture', su);
    });
    var pa = document.getElementById('bsiG-pausa');
    if (pa) pa.onclick = function () {
      if (schermo === 'gioco') inPausa(); else riprendi();
    };
  }

  /* ════════════════════════════════════════════════════════════════════════════
     IL MENU' DI PAUSA

     Quando si gioca su un telefono la pausa non e' un lusso: e' il posto
     dove si torna quando suona qualcosa. Deve esserci dentro tutto quello
     che serve senza uscire dal gioco — la guida, la lingua, il suono, lo
     schermo pieno, e dove si e' arrivati.

     La lingua NON si ricambia qui: l'elenco delle lingue e il cambio vero
     stanno in `BSILingue`/`BSISelLingua`, e questo menu' li chiama. Se un
     giorno si aggiunge una lingua, compare anche qui senza toccare questo
     file. Se quei moduli non ci sono (il gioco deve funzionare anche da
     solo, pure senza rete), la riga delle bandiere semplicemente non si
     disegna, e il resto del menu' resta intero.
     ════════════════════════════════════════════════════════════════════════════ */
  var guidaAperta = false;

  function lingueDisponibili() {
    var L = globale.BSILingue;
    if (!L || !L.lingue) return [];
    var e = L.lingue();
    return (e && e.length) ? e : [];
  }

  function righeBandiere() {
    var el = lingueDisponibili();
    if (!el.length) return '';
    var ora = (globale.BSILingue && globale.BSILingue.corrente)
      ? globale.BSILingue.corrente() : 'it';
    var h = '<div class="bsiG-etic">' + t('lingua', 'language') + '</div>' +
      '<div class="bsiG-bandiere">';
    el.forEach(function (l) {
      h += '<button class="bsiG-fl' + (l.codice === ora ? ' on' : '') +
        '" data-bsi-lingua="' + esc(l.codice) + '" title="' + esc(l.nome) +
        '" aria-label="' + esc(l.nome) + '">' + (l.bandiera || '⚑') + '</button>';
    });
    return h + '</div>';
  }

  function inPausa() {
    if (schermo !== 'gioco' || !S) return;
    schermo = 'pausa'; tasti = {}; fermaCiclo(); pausa();
  }

  function riprendi() {
    if (schermo !== 'pausa') return;
    guidaAperta = false;
    schermo = 'gioco'; disegnaUI(); avviaCiclo();
  }

  function pausa() {
    var u = ui();
    if (!u || !S) return;
    u.className = 'attiva';
    u.innerHTML = '<div class="bsiG-scheda bsiG-pau">' +
      '<div class="bsiG-tit">❚❚ ' + t('IN PAUSA', 'PAUSED') + '</div>' +
      '<div class="bsiG-stato">' +
        '<span><b>' + esc(S.diff.nome) + '</b></span>' +
        '<span>' + t('livello ', 'level ') + S.livello + '/' + LIVELLI + '</span>' +
        '<span>' + t('punti ', 'score ') + S.punti + '</span>' +
        '<span>' + (S.vite > 0 ? new Array(S.vite + 1).join('♥') :
                    t('ultima vita', 'last life')) + '</span>' +
        '<span>' + (S.elemento ? esc(S.elemento.sim + ' ' + S.elemento.nome)
                               : t('nessun elemento', 'no element')) + '</span>' +
      '</div>' +
      '<button class="bsiG-b" id="bsiG-riprendi">▶ ' + t('riprendi', 'resume') + '</button>' +
      '<button class="bsiG-b bsiG-b2" id="bsiG-guida" aria-expanded="' +
        (guidaAperta ? 'true' : 'false') + '">' +
        (guidaAperta ? t('chiudi la guida', 'close the guide')
                     : t('guida: come si gioca', 'guide: how to play')) + '</button>' +
      (guidaAperta ? '<div class="bsiG-sub" id="bsiG-guidaT" style="text-align:left">' +
        guida() + '</div>' : '') +
      righeBandiere() +
      '<div class="bsiG-etic">' + t('impostazioni', 'settings') + '</div>' +
      '<div class="bsiG-bandiere">' +
        '<button class="bsiG-b bsiG-b2" id="bsiG-suono">' +
          (suono ? '🔊 ' + t('suono acceso', 'sound on')
                 : '🔇 ' + t('suono spento', 'sound off')) + '</button>' +
        '<button class="bsiG-b bsiG-b2" id="bsiG-pieno2">⛶ ' +
          (pieno ? t('finestra', 'windowed') : t('schermo pieno', 'full screen')) +
        '</button>' +
      '</div>' +
      '<button class="bsiG-b bsiG-b2" id="bsiG-abbandona">' +
        t('abbandona la partita', 'give up the run') + '</button></div>';

    document.getElementById('bsiG-riprendi').onclick = riprendi;
    document.getElementById('bsiG-guida').onclick = function () {
      guidaAperta = !guidaAperta; pausa();
    };
    document.getElementById('bsiG-suono').onclick = function () {
      suono = !suono; if (suono) bip(660, 0.07); pausa();
    };
    document.getElementById('bsiG-pieno2').onclick = function () {
      schermoPieno(!pieno); pausa();
    };
    document.getElementById('bsiG-abbandona').onclick = function () {
      guidaAperta = false;
      schermo = 'titolo'; S = null; schermoPieno(false); disegnaUI();
    };
    [].forEach.call(u.querySelectorAll('[data-bsi-lingua]'), function (b) {
      b.onclick = function () {
        var c = b.getAttribute('data-bsi-lingua');
        /* il cambio vero lo fa chi lo sa fare; qui si chiede soltanto */
        if (globale.BSISelLingua && globale.BSISelLingua.scegli) {
          globale.BSISelLingua.scegli(c);
        } else if (globale.BSILingue && globale.BSILingue.imposta) {
          globale.BSILingue.imposta(c);
        }
        pausa();
      };
    });
  }

  /* ── la tabella degli elementi, sotto la scena ───────────────────────── */
  function sotto() {
    var s = document.getElementById('bsiG-sotto');
    if (!s) return;
    var h = '<details><summary style="cursor:pointer;color:#5eead4;font-weight:700;' +
      'font-size:13px">' + t('⚛ I ' + POTERI.length + ' elementi e che cosa fanno',
                             '⚛ The ' + POTERI.length + ' elements and what they do') +
      '</summary><table class="bsiSP-tbl" style="margin-top:10px"><tr><th>' +
      t('elemento', 'element') + '</th><th>' + t('abilità', 'ability') + '</th><th>' +
      t('perché', 'why') + '</th></tr>';
    POTERI.forEach(function (p) {
      var d = datiElemento(p.sim);
      h += '<tr><td><b style="color:' + (COLORI[p.ab] || '#fff') + '">' + p.sim +
        '</b> ' + esc(d ? d.nome : '') + (d ? ' <span style="color:#7a96b0">Z ' + d.Z +
        '</span>' : '') + '</td><td>' + esc(p.ab) + '</td><td>' + esc(p.perche) +
        '</td></tr>';
    });
    h += '</table><p style="font-size:11px;color:#7a96b0;margin-top:8px">' +
      t('Nome e numero atomico vengono dalla tavola periodica dell’applicazione, ' +
        'non riscritti qui. L’abilità è progetto di gioco; il «perché» è la chimica ' +
        'da cui viene.',
        'Name and atomic number come from the application’s periodic table, not ' +
        'rewritten here. The ability is game design; the "why" is the chemistry it ' +
        'comes from.') + '</p></details>';
    s.innerHTML = h;
  }

  /* ── tastiera ───────────────────────────────────────────────────────── */
  function tastiera() {
    function mappa(e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'sx';
      if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'dx';
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ' || k === 'Spacebar') return 'su';
      if (k === 'k' || k === 'K' || k === 'j' || k === 'J') return 'fuoco';
      return null;
    }
    document.addEventListener('keydown', function (e) {
      if (!visibile()) return;
      /* ESC e P mettono in pausa: su un computer nessuno cerca il tasto ❚❚
         col mouse mentre un nemico arriva */
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (schermo === 'gioco') { e.preventDefault(); inPausa(); }
        else if (schermo === 'pausa') { e.preventDefault(); riprendi(); }
        return;
      }
      var k = mappa(e);
      if (!k) return;
      /* la barra spaziatrice scorrerebbe la pagina: in gioco no */
      if (e.key === ' ' || e.key.indexOf('Arrow') === 0) e.preventDefault();
      tasti[k] = true;
    });
    document.addEventListener('keyup', function (e) {
      var k = mappa(e);
      if (k) tasti[k] = false;
    });
    /* uscendo dalla pagina i tasti si liberano: tornando, non si trova il
       personaggio che corre da solo contro un muro */
    window.addEventListener('blur', function () { tasti = {}; });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { tasti = {}; fermaCiclo(); }
    });
  }

  /* ═════════════════════════════════════════════════════════════════════════
     INNESTO
     ═════════════════════════════════════════════════════════════════════════ */
  function pulsante() {
    var b = document.querySelector('.nav-btn[data-s="' + ID + '"]');
    if (b) return b;
    var gruppo = document.getElementById('navGroup5') ||
                 document.getElementById('navGroup6');
    if (!gruppo) return null;
    b = document.createElement('button');
    b.className = 'nav-btn';
    b.setAttribute('data-s', ID);
    b.textContent = '🎮 ' + t('Gioco', 'Game');
    b.style.cssText = 'border:1px solid #7c6fff;background:linear-gradient(135deg,' +
      'rgba(124,111,255,.18),rgba(94,234,212,.1))';
    gruppo.appendChild(b);
    return b;
  }

  /* ── SCHERMO PIENO ─────────────────────────────────────────────────── */
  var pieno = false;
  function schermoPieno(v) {
    pieno = (v == null) ? !pieno : !!v;
    document.body.classList.toggle('bsiG-pieno', pieno);
    var b = document.getElementById('bsiG-pieno');
    if (b) {
      b.textContent = pieno ? '⤡' : '⛶';
      b.setAttribute('aria-label', pieno ? t('esci da schermo pieno', 'leave full screen')
                                         : t('schermo pieno', 'full screen'));
    }
    /* la vera API in piu', quando c'e': migliora, ma non serve */
    try {
      var sc = document.getElementById('bsiG-scena');
      if (pieno && sc && sc.requestFullscreen) sc.requestFullscreen().catch(function () {});
      else if (!pieno && document.exitFullscreen && document.fullscreenElement)
        document.exitFullscreen().catch(function () {});
    } catch (e) {}
    disegnaUI();
    return pieno;
  }

  /* IL GIOCO DEVE ESSERE IN VISTA, NON SOTTO MEZZO SCHERMO DI TESTO.
     Misurato su telefono: la tela cominciava a 523 px su una finestra di
     844, quindi per giocare bisognava scorrere. Aprendo la sezione la scena
     si porta in vista da se'. */
  /* NON CI STA? ALLORA SCHERMO PIENO, E LO SI DECIDE MISURANDO.
     In orizzontale su un telefono (844×390) la scena rimpicciolisce come
     deve, ma il titolo e l'introduzione sopra consumano comunque abbastanza
     da spingere i comandi 23 px sotto il bordo: misurato, non supposto. Un
     gioco in cui girando il telefono i comandi escono dallo schermo e'
     ingiocabile.
     Quindi quando si entra in partita si misura se scena piu' comandi
     stanno nella finestra, e se non ci stanno si va a schermo pieno. Non
     «se e' un telefono»: se NON CI STA. */
  function stannoDentro() {
    var sc = document.getElementById('bsiG-scena');
    var co = document.getElementById('bsiG-comandi');
    if (!sc || !co) return true;
    var a = sc.getBoundingClientRect(), b = co.getBoundingClientRect();
    return (a.height + b.height + 24) <= window.innerHeight;
  }

  function pienoSeServe() {
    if (pieno) return false;
    if (stannoDentro()) return false;
    schermoPieno(true);
    return true;
  }

  /* SI PORTA IN VISTA I COMANDI, NON LA SCENA, E C'E' UN MOTIVO.
     Centrando la scena, i comandi — che stanno sotto — possono restare
     fuori: misurato in orizzontale, scena a `top 187` e comandi che
     finivano a 413 su una finestra di 390. Portando in vista i COMANDI
     («block:end», cioe' appoggiati al bordo inferiore) e sapendo che scena
     piu' comandi stanno nella finestra, la scena viene su da se'. */
  function inVista() {
    var co = document.getElementById('bsiG-comandi');
    var sc = document.getElementById('bsiG-scena');
    var bersaglio = co || sc;
    if (!bersaglio) return;
    try { bersaglio.scrollIntoView({ block: 'end', behavior: 'smooth' }); }
    catch (e) { bersaglio.scrollIntoView(false); }
  }

  function applica() {
    stile();
    if (!costruisci()) return false;
    intro();
    sotto();
    tela = document.getElementById('bsiG-tela');
    ctx = tela ? tela.getContext('2d') : null;
    comandi();          /* sempre: sono i comandi, non un dettaglio della partita */
    var bp = document.getElementById('bsiG-pieno');
    if (bp && !bp._bsi) { bp._bsi = 1; bp.onclick = function () { schermoPieno(); }; }
    pulsante();
    if (schermo === 'titolo') disegnaUI();
    return true;
  }

  function avvia() {
    applica();
    tastiera();
    /* il ciclo parte quando si apre la sezione, non all'avvio: un gioco che
       gira in una sezione che nessuno guarda è solo batteria consumata */
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest
        ? e.target.closest('.nav-btn[data-s="' + ID + '"]') : null;
      if (!b) return;
      setTimeout(function () {
        applica();
        inVista();
        disegnaUI();
        /* il ciclo parte sempre: il titolo è animato. Si ferma da sé quando
           la sezione non si vede — verificato nei due versi dal banco. */
        avviaCiclo();
      }, 70);
    }, false);
    [500, 1500, 3200].forEach(function (ms) { setTimeout(pulsante, ms); });
    /* girando il telefono in partita: prima si prova a rimettere tutto in
       vista, e solo se davvero non ci sta si va a schermo pieno */
    function risistema() {
      if (schermo !== 'gioco' || !visibile() || pieno) return;
      if (!pienoSeServe()) inVista();
    }
    window.addEventListener('resize', function () { setTimeout(risistema, 60); });
    window.addEventListener('orientationchange', function () { setTimeout(risistema, 320); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else avvia();

  document.addEventListener('bsi-lingua', function () {
    intro(); sotto();
    var b = document.querySelector('.nav-btn[data-s="' + ID + '"]');
    if (b) b.textContent = '🎮 ' + t('Gioco', 'Game');
    var c = document.getElementById('bsiG-comandi');
    if (c) { c.removeAttribute('data-bsi-pronti'); comandi(); }
    disegnaUI();
  });

  globale.BSIGioco = {
    ID: ID, LARGO: LARGO, ALTO: ALTO, POTERI: POTERI, SPARA: SPARA,
    DIFFICOLTA: DIFFICOLTA, generaLivello: generaLivello, terrenoA: terrenoA,
    applica: applica, nuovaPartita: nuovaPartita, caricaLivello: caricaLivello,
    Caso: Caso, NOME: NOME, FONT: FONT, LIVELLI: LIVELLI, guida: guida,
    pausa: pausa, inPausa: inPausa, riprendi: riprendi,
    lingueDisponibili: lingueDisponibili,
    scrivi: scrivi, largoTesto: largoTesto, disegnaTitolo: disegnaTitolo,
    /* per il banco e per chi vuole guidare il gioco da fuori */
    schermo: function (s) { if (s) { schermo = s; disegnaUI(); } return schermo; },
    stato: function () { return S; },
    tasti: function (k, giu) { if (k) tasti[k] = !!giu; return tasti; },
    passo: passo, disegna: disegna,
    avviaCiclo: avviaCiclo, fermaCiclo: fermaCiclo,
    domandaAperta: function () { return domandaCorrente; },
    rispondi: rispondi, chiudiDomanda: chiudiDomanda,
    suono: function (v) { if (v != null) suono = !!v; return suono; },
    schermoPieno: schermoPieno, inVista: inVista,
    stannoDentro: stannoDentro, pienoSeServe: pienoSeServe,
    pieno: function () { return pieno; },
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
