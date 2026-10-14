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
     L'ICONA

     Si disegna qui, con lo stesso personaggio, e si consegna come immagine ai
     due posti che la mostrano: il pulsante nella barra e il titolo della
     sezione. Non è un file: è una tela disegnata una volta e trasformata in
     `data:` — così non c'è niente da scaricare, e l'icona non può «mancare»
     quando si è senza rete.

     Non entra come `<img>` dentro quei due elementi, e c'è un motivo: il
     cambio lingua riscrive il loro TESTO, e riscrivendolo porterebbe via
     qualunque figlio. Entra come immagine di sfondo di uno pseudo-elemento,
     dove il testo non arriva.
     ═════════════════════════════════════════════════════════════════════════ */
  var iconaFatta = null;

  function icona() {
    if (iconaFatta) return iconaFatta;
    var L = 64;
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = L;
    var q = cv.getContext('2d');
    q.imageSmoothingEnabled = false;
    /* il fondo: la provetta vista da dentro */
    var g = q.createRadialGradient(L * 0.38, L * 0.3, 2, L / 2, L / 2, L * 0.72);
    g.addColorStop(0, '#1d4f7a'); g.addColorStop(1, '#061322');
    q.fillStyle = g;
    q.beginPath(); q.arc(L / 2, L / 2, L / 2 - 1, 0, 6.2832); q.fill();
    q.strokeStyle = 'rgba(94,234,212,.85)'; q.lineWidth = 2;
    q.beginPath(); q.arc(L / 2, L / 2, L / 2 - 2, 0, 6.2832); q.stroke();
    /* il legame che entra da sinistra: dice che gioco è */
    q.strokeStyle = 'rgba(94,234,212,.55)'; q.lineWidth = 2;
    q.beginPath(); q.moveTo(6, 52); q.lineTo(30, 34); q.stroke();
    q.fillStyle = '#7f9ec2';
    q.beginPath(); q.arc(7, 53, 5, 0, 6.2832); q.fill();
    /* l'atomo con la faccia, grande: a tredici pixel si deve riconoscere */
    var vero = ctx;
    ctx = q;
    disegnaAtomo(34, 30, 17, '#5eead4', 2, 0, null);
    ctx = vero;
    q.fillStyle = '#ffffff';
    q.fillRect(27, 26, 6, 6); q.fillRect(38, 26, 6, 6);
    q.fillStyle = '#06131f';
    q.fillRect(29, 28, 4, 4); q.fillRect(40, 28, 4, 4);
    iconaFatta = cv.toDataURL('image/png');
    return iconaFatta;
  }

  function mettiIcona() {
    try {
      document.documentElement.style.setProperty('--bsiG-ico', 'url(' + icona() + ')');
    } catch (e) { /* senza icona il gioco si gioca uguale */ }
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
    { sim: 'H',  ab: 'salto',    perche: t('il più leggero che esista: sali in fretta',
                                           'the lightest there is: you rise fast') },
    { sim: 'He', ab: 'planata',  perche: t('gas nobile: inerte e calmo, ti muovi piano e preciso',
                                           'noble gas: inert and calm, you move slowly and precisely') },
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
    { sim: 'Fe', ab: 'tuffo',    perche: t('pesante: affondi in fretta e sfondi i cristalli',
                                           'heavy: you sink fast and smash through crystals') },
    { sim: 'Cu', ab: 'fulmine',  perche: t('conduce: il colpo è una scarica',
                                           'it conducts: the shot is a discharge') },
    { sim: 'Zn', ab: 'armatura', perche: t('zinca: protegge il ferro sacrificandosi',
                                           'it galvanises: it protects iron by sacrificing itself') },
    { sim: 'Ag', ab: 'doppio',   perche: t('il miglior conduttore: raddoppia tutto',
                                           'the best conductor: it doubles everything') },
    { sim: 'Au', ab: 'inerte',   perche: t('non si ossida: gli ossidanti non lo toccano',
                                           'it does not oxidise: oxidisers cannot touch it') },
    { sim: 'Hg', ab: 'veloce',   perche: t('metallo liquido: scorre, e il solvente non lo frena',
                                           'liquid metal: it flows, and the solvent barely slows it') },
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
     LA PROVETTA, E COME CI SI MUOVE DENTRO

     QUI NON SI CAMMINA E NON SI SALTA. Non c'e' terreno: c'e' un solvente che
     scorre, e ci si muove come si muove un atomo in soluzione — facendo e
     rompendo LEGAMI.

       · si galleggia o si affonda secondo la propria MASSA, confrontata con
         quella media dell'aria: piu' leggero dell'aria sale, piu' pesante
         scende. E' la regola dei gas, presa come regola di gioco: qui si
         confronta la massa ATOMICA con 28,96 u, non la densita' di una
         sostanza reale, e si dice invece di lasciarlo credere;
       · una CORRENTE spinge indietro, sempre. Stare fermi fa perdere terreno;
       · tenendo premuto il tasto del legame ci si lega all'atomo piu' vicino
         a portata e gli si gira intorno; lasciandolo si parte per la
         tangente, con la velocita' che si era accumulata. Questo e' il
         movimento: non un salto, una FIONDA fatta di legami;
       · la distanza del legame viene dai RAGGI ATOMICI veri dei due atomi;
       · un legame si ROMPE se la tensione supera quello che regge, e quello
         che regge viene dall'ENERGIA DI IONIZZAZIONE del tuo elemento;
       · la differenza di ELETTRONEGATIVITA' decide che legame e': sotto 0,4
         covalente (gira libero), fino a 1,7 polare (tira un po' dentro),
         sopra ionico (tira forte e non perdona). Le due soglie sono quelle
         convenzionali di Pauling, e sono scritte qui perche' si vedano.

     Tutti i numeri degli elementi — massa, raggio, elettronegativita',
     energia di ionizzazione — si leggono da `ELEMENTS`, la tavola periodica
     che l'applicazione ha gia'. Nessun secondo elenco di chimica.
     ═════════════════════════════════════════════════════════════════════════ */
  /* I NUMERI DEL MOVIMENTO, E PERCHE' SONO QUESTI.

     La regola del gioco e' una sola: SI AVANZA SOLO CON I LEGAMI. Non e' uno
     slogan, e' una disuguaglianza fra due numeri, e sta scritta qui:

         spinta da liberi (0,008)  <  corrente (0,012)

     Finche' vale quella riga, nuotare non puo' far guadagnare terreno in
     nessuna difficolta', con nessun elemento: si rallenta la deriva, non la
     si inverte. Il banco la prova togliendo TUTTE le ancore a un livello e
     guardando dove arriva un pilota automatico — se arrivasse in fondo lo
     stesso, questo gioco non sarebbe quello che dice di essere. (E' successo:
     con i primi numeri arrivava al 91%.)

     Il solvente frena dell'1,3% a ogni passo, quindi ogni spinta costante
     arriva a una velocita' di equilibrio pari a spinta/0,013:
       · la corrente porta indietro a ~0,9 px/passo — si perde terreno piano,
         c'e' il tempo di rimediare;
       · da LEGATI si spinge SULLA CURVA, 0,09: in pochi giri si arriva al
         tetto di 5,4 px/passo. Lasciato il legame a quella velocita' si
         percorrono piu' di 250 px prima di fermarsi, e due ancore non distano
         mai piu' di 104. La fionda copre sempre il salto successivo: e' il
         conto che rende il livello attraversabile, e non un'impressione;
       · il galleggiamento, a massa estrema, vale ~1,2 px/passo: dal centro
         alla superficie un paio di secondi. Abbastanza per dover fare
         qualcosa, non cosi' poco da non poterlo;
       · da liberi si affonda di 0,012 e, tenendo premuto il tasto del legame,
         si sale di 0,034: in verticale si decide, in orizzontale no. E'
         questa asimmetria a fare il gioco. */
  var M_ARIA = 28.96;          /* massa media dell'aria, u: il paragone */
  /* IL GALLEGGIAMENTO MODULA L'AFFONDAMENTO, NON LO ROVESCIA: 0,010 è meno
     di `SEDIMENTA` (0,012), quindi anche l'idrogeno scende — piano — se non
     si tiene premuto. Lasciare che lo rovesciasse sembrava più fedele alla
     chimica ed era una trappola: con l'idrogeno addosso si finiva incollati
     alla superficie, senza modo di scendere, a prendere danno fino alla fine
     della partita. Misurato: un pilota automatico con l'idrogeno è arretrato
     da 1207 px a 308 strisciando sul soffitto. Quello che l'elemento cambia è
     QUANTO si scende e quanto si risale: l'idrogeno quasi galleggia, il piombo
     precipita. */
  var SPINTA = 0.010;          /* quanto il galleggiamento modula, al massimo */
  var CORRENTE = 0.012;        /* la corrente del solvente, verso sinistra */
  var BRACCIATA = 0.008;       /* la spinta da liberi: MENO della corrente */
  var POMPA = 0.090;           /* la spinta sulla curva, da legati */
  var VISCOSITA = 0.013;       /* l'attrito del solvente, per passo */
  var PORTATA = 72;            /* da quanto lontano si aggancia un legame */
  var DIST_MAX = 104;          /* distanza massima fra due ancore consecutive */
  var SEDIMENTA = 0.012;       /* tutti affondano un po': e' una soluzione */
  var NUOTO_SU = 0.034;        /* tenendo il tasto del legame si sale */
  var V_MAX = 5.4;
  /* LE ANCORE STANNO LONTANE DAI BORDI QUANTO IL LEGAME PIU' LUNGO, e un po'
     di piu': un'ancora a quaranta pixel dalla superficie, con un legame da
     cinquantaquattro, manda in orbita FUORI dalla provetta — e lassù il
     giocatore veniva schiacciato fra il bordo che lo respinge e il legame che
     lo tiene, perdeva tutta la velocità e non ripartiva più. Misurato: il
     pilota automatico restava inchiodato a y=8 per duemila fotogrammi. */
  var BORDO = 62;              /* quanto le ancore stanno lontane dai bordi */

  /* I PROFILI: un elemento, quattro numeri veri, e che cosa ne viene.
     Se la tavola non c'e' (il gioco deve girare anche da solo) si usa un
     profilo neutro, e si vede subito perche' tutti gli atomi diventano
     uguali: meglio di un gioco che non parte. */
  var profiliNoti = {};

  function profilo(sim) {
    /* SENZA ELEMENTO NON SI GALLEGGIA E NON SI AFFONDA. Si parte da un atomo
       generico con la massa media dell'aria: indice di galleggiamento zero,
       sta dov'è. Il primo tentativo faceva partire da elio — leggero,
       inerte, bello da raccontare — e il risultato misurato era che nei primi
       due secondi si saliva fino alla superficie e si evaporava senza aver
       toccato niente. Un inizio che uccide da solo non è una difficoltà: è un
       difetto. */
    if (!sim) sim = '·neutro';
    if (profiliNoti[sim]) return profiliNoti[sim];
    var r = { sim: sim, massa: 28.96, raggio: 100, en: 2.2, ion: 10, periodo: 3,
              nome: sim, Z: 0, nota: '', vero: false };
    try {
      var el = globale.ELEMENTS;
      if (el && el.length && el[0] && el[0].length > 10) {
        for (var i = 0; i < el.length; i++) if (el[i][1] === sim) {
          r = { sim: sim, Z: el[i][0], nome: el[i][2],
                massa: el[i][3], periodo: el[i][4],
                en: (el[i][9] == null ? 0 : el[i][9]),
                raggio: (el[i][10] == null ? 100 : el[i][10]),
                ion: (el[i][11] == null ? 10 : el[i][11]),
                nota: el[i][13] || '', vero: true };
          break;
        }
      }
    } catch (e) { /* senza tavola si gioca con il profilo neutro */ }
    /* da qui in giu' sono regole di gioco, derivate dai numeri veri */
    r.sale = Math.max(-1, Math.min(1, (M_ARIA - r.massa) / M_ARIA));
    r.corpo = Math.max(4, Math.min(11, Math.round(r.raggio / 16) + 3));
    r.inerzia = Math.max(0.9, Math.min(2.4, Math.pow(r.massa / M_ARIA, 0.45)));
    r.tenuta = 0.55 + r.ion / 9;        /* quanta tensione regge un legame */
    r.gusci = Math.max(1, Math.min(7, r.periodo || 1));
    profiliNoti[sim] = r;
    return r;
  }

  /* che legame e': la differenza di elettronegativita' lo dice */
  function tipoLegame(a, b) {
    var d = Math.abs((a.en || 0) - (b.en || 0));
    if (d >= 1.7) return 'ionico';
    if (d >= 0.4) return 'polare';
    return 'covalente';
  }

  var COL_LEGAME = { covalente: '#5eead4', polare: '#ffd93d', ionico: '#ff6bd6' };

  /* gli atomi che fanno da ancora: elementi che un legame lo fanno davvero */
  var ANCORE = ['C', 'N', 'O', 'S', 'P', 'Cl', 'Si', 'Na', 'Ca', 'Fe', 'Mg', 'K'];

  function lunghezzaLegame(pa, pb) {
    /* i raggi atomici veri, in picometri, riscalati alla provetta */
    return Math.max(22, Math.min(54, (pa.raggio + pb.raggio) / 7 + 12));
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL LIVELLO — una catena di ancore, e la garanzia che si possa percorrere

     LA REGOLA CHE RENDE UN LIVELLO GIOCABILE: due ancore consecutive non
     possono distare piu' di `DIST_MAX`, perche' quella e' la distanza che si
     copre partendo per la tangente con la velocita' massima che un legame
     regge. Si garantisce per COSTRUZIONE — si sceglie prima lo scostamento
     orizzontale, poi quello verticale dentro quello che resta — e il banco la
     verifica per conto suo su tutti e sessanta i livelli. Senza questa regola
     un livello generato a caso produce un tratto che non si attraversa, e chi
     gioca non ha modo di sapere che e' rotto il gioco e non lui.
     ═════════════════════════════════════════════════════════════════════════ */
  function generaLivello(livello, diff, partita) {
    var caso = Caso((livello * 7919 + diff.n * 104729 + partita * 15485863) >>> 0);
    var largo = 1700 + livello * 240;
    var boss = (livello % 3 === 0);
    var i;

    /* la catena di ancore */
    var ancore = [];
    var x = 150, y = ALTO / 2;
    while (x < largo - 150) {
      var sim = ANCORE[Math.floor(caso() * ANCORE.length)];
      ancore.push({ x: Math.round(x), y: Math.round(y), sim: sim,
                    pro: profilo(sim), t: Math.floor(caso() * 100) });
      /* IL MARGINE DI DUE PIXEL NON E' PRUDENZA: le coordinate si arrotondano
         a numero intero, e due arrotondamenti possono allungare la distanza
         di un pixel. Il banco misura le coordinate VERE, quelle arrotondate,
         e con `DIST_MAX` esatto trovava un salto da 105 su un limite di 104. */
      var tetto = DIST_MAX - 2;
      var dx = 56 + caso() * (tetto - 56);
      var resto = Math.sqrt(Math.max(0, tetto * tetto - dx * dx));
      /* LO SCALINO VERTICALE E' PIU' STRETTO DI QUELLO ORIZZONTALE, e non per
         simmetria: avanti ci si va con la fionda, in alto si va controvoglia —
         e con un elemento pesante addosso si affonda mentre si sale. Con uno
         scarto verticale fino a 74 px il pilota automatico si fermava su tre
         livelli su dodici; a 52 li attraversa tutti. */
      var dy = (caso() * 2 - 1) * Math.min(resto, 52);
      /* UN RICHIAMO VERSO IL CENTRO. Una passeggiata casuale si appoggia ai
         bordi e ci resta: su un livello uscivano dieci ancore di fila tutte
         alla stessa quota massima, e lassù l'orbita è schiacciata fra il
         bordo e l'ancora. Un quarto di correzione basta a staccarle dal
         bordo senza raddrizzare la catena. */
      dy += (ALTO / 2 - y) * 0.25;
      if (Math.abs(dy) > resto) dy = (dy < 0 ? -1 : 1) * resto;
      x += dx;
      y = Math.max(BORDO, Math.min(ALTO - BORDO, y + dy));
    }

    function lontanoDaAncore(ax, ay, quanto) {
      for (var k = 0; k < ancore.length; k++) {
        if (Math.abs(ancore[k].x - ax) < quanto &&
            Math.abs(ancore[k].y - ay) < quanto) return false;
      }
      return true;
    }

    /* i cristalli: taglienti, fermi, e MAI sopra un'ancora — un cristallo
       addosso a un'ancora renderebbe impossibile usarla */
    var cristalli = [];
    var quantiCr = Math.round((4 + livello * 0.9) * diff.nemici);
    for (i = 0; i < quantiCr; i++) {
      var cx = 240 + caso() * (largo - 420);
      var cy = 26 + caso() * (ALTO - 52);
      if (!lontanoDaAncore(cx, cy, 44)) continue;
      cristalli.push({ x: Math.round(cx), y: Math.round(cy),
                       r: 7 + Math.round(caso() * 6), t: Math.floor(caso() * 100) });
    }

    /* le bolle: salgono, e chi le prende sale con loro */
    var bolle = [];
    for (i = 0; i < 10 + livello; i++) {
      bolle.push({ x: Math.round(200 + caso() * (largo - 300)),
                   y: Math.round(caso() * ALTO), r: 4 + Math.round(caso() * 4),
                   v: 0.25 + caso() * 0.5 });
    }

    /* i radicali: hanno un elettrone spaiato, e vanno dove capita */
    var nemici = [];
    var quanti = Math.round((7 + livello * 1.5) * diff.nemici);
    for (i = 0; i < quanti; i++) {
      var ex = 260 + caso() * (largo - 460);
      var ey = 24 + caso() * (ALTO - 48);
      if (!lontanoDaAncore(ex, ey, 30)) continue;
      nemici.push({
        x: Math.round(ex), y: Math.round(ey),
        vx: (caso() < 0.5 ? -1 : 1) * (0.25 + caso() * 0.55) * diff.vel,
        vy: (caso() < 0.5 ? -1 : 1) * (0.12 + caso() * 0.4) * diff.vel,
        tipo: caso() < 0.6 ? 'deriva' : 'insegue',
        vivo: true, t: Math.floor(caso() * 100),
        /* un «ossidante» e' quello che l'oro ignora: la chimica dentro la
           regola, non accanto */
        ossidante: caso() < 0.4
      });
    }

    /* gli elementi da raccogliere: vicino a un'ancora, cosi' si prendono
       girandoci intorno invece che per caso */
    var elementi = [];
    var quantiEl = 4 + Math.floor(caso() * 3) + (diff.n <= 2 ? 2 : 0);
    for (i = 0; i < quantiEl && ancore.length > 4; i++) {
      var an = ancore[3 + Math.floor(caso() * (ancore.length - 5))];
      var p = POTERI[Math.floor(caso() * POTERI.length)];
      elementi.push({ x: an.x + (caso() < 0.5 ? -1 : 1) * 26,
                      y: Math.max(20, Math.min(ALTO - 20, an.y + (caso() * 2 - 1) * 26)),
                      sim: p.sim, ab: p.ab, preso: false, t: Math.floor(caso() * 100) });
    }
    if (boss && ancore.length > 3) {
      /* garantito: un elemento che spara, poco prima dell'arena. Un boss
         senza di quello sarebbe invincibile */
      var sparanti = POTERI.filter(function (p2) { return SPARA[p2.ab]; });
      var ps = sparanti[Math.floor(caso() * sparanti.length)];
      var ag = ancore[ancore.length - 3];
      elementi.push({ x: ag.x, y: Math.max(16, ag.y - 36), sim: ps.sim, ab: ps.ab,
                      preso: false, t: 0, garantito: true });
    }

    /* i punti di controllo: due membrane da attraversare, dove arriva la
       domanda */
    var controlli = [
      { x: Math.round(largo * 0.35), fatto: false },
      { x: Math.round(largo * 0.7), fatto: false }
    ];

    return {
      livello: livello, zona: Math.ceil(livello / 3), boss: boss,
      largo: largo, ancore: ancore, cristalli: cristalli, bolle: bolle,
      nemici: nemici, elementi: elementi, controlli: controlli,
      /* il boss finale e' al dodicesimo: piu' vita e due fasi */
      finale: livello === LIVELLI
    };
  }

  /* l'ancora piu' vicina a portata: la stessa funzione che usa il gioco e che
     usa il banco, perche' una seconda copia direbbe un'altra cosa */
  function ancoraVicina(liv, x, y, portata, escluso) {
    var mi = -1, md = portata * portata;
    for (var i = 0; i < liv.ancore.length; i++) {
      if (escluso != null && i === escluso) continue;
      var a = liv.ancore[i];
      var dx = a.x - x, dy = a.y - y, d = dx * dx + dy * dy;
      if (d < md) { md = d; mi = i; }
    }
    return mi;
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

  /* `seme` serve a chi vuole la STESSA partita: il banco lo usa per provare
     sempre gli stessi dodici livelli, altrimenti misurerebbe ogni volta un
     gioco diverso e non saprebbe mai se è peggiorato. Chi gioca non lo passa,
     e ogni partita è nuova. */
  function nuovaPartita(nDiff, seme) {
    var diff = DIFFICOLTA()[nDiff - 1] || DIFFICOLTA()[0];
    S = {
      diff: diff,
      partita: seme ? (seme >>> 0)
                    : ((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0),
      livello: 1, vite: diff.vite, punti: 0, moltiplicatore: 1,
      elemento: null, profilo: profilo('He'), scudo: 0, invincibile: 0,
      tempoRisposta: diff.tempo,
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
    /* SI PARTE SENZA ELEMENTO, e senza elemento si è elio: leggero, inerte,
       nobile — l'atomo che non reagisce con niente. Chi non ha ancora
       raccolto nulla galleggia e basta, ed è esattamente la sensazione
       giusta per il primo minuto di gioco. */
    /* SI PARTE A PORTATA DELLA PRIMA ANCORA, sempre. A nuoto non si avanza —
       è la regola di questo gioco — quindi nascere lontani da qualunque atomo
       significherebbe nascere senza niente da fare, e la corrente farebbe il
       resto. */
    var a1 = S.liv.ancore[0];
    S.p = { x: a1 ? Math.max(20, a1.x - 30) : 60, y: a1 ? a1.y : ALTO / 2, vx: 0, vy: 0,
            legame: null, ultimo: null, raggio: 0, raggio0: 0, tipo: 'covalente',
            tensione: 0, grazia: 0, attesa: 0, guarda: 1, anim: 0,
            immune: 0, scia: [] };
    if (!S.elemento) S.profilo = profilo(null);
    S.cam = 0;
    S.proiettili = [];
    S.particelle = [];
    S.boss = S.liv.boss ? {
      x: S.liv.largo - 110, y: ALTO / 2, vx: 0, vy: 0, w: 34, h: 34,
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
    var pro = S.profilo;

    /* ── il solvente: si affonda, si sale, la corrente, l'attrito ──────
       IL COMANDO VERTICALE E' IL TASTO DEL LEGAME, e non ne serve un altro:
       tenendolo premuto si agita il solvente e si SALE, lasciandolo si
       affonda — e se intanto passa un'ancora a portata, ci si lega. Un solo
       gesto per due cose che in acqua sono la stessa cosa: allungarsi verso
       l'alto e aggrapparsi.

       Senza questo non c'era NESSUN controllo verticale da liberi: misurato
       con il pilota automatico, un atomo neutro sbalzato contro la superficie
       restava a ventun pixel dall'alto per sempre, derivando all'indietro
       senza un'ancora alla sua altezza, finché la corrente non lo portava
       fuori. Non era difficile: era bloccato. */
    var sale = pro.sale + (ab === 'salto' ? 0.5 : 0) - (ab === 'tuffo' ? 0.6 : 0);
    p.vy += SEDIMENTA;
    p.vy -= Math.max(-1.4, Math.min(1.4, sale)) * SPINTA;
    if (p.legame === null && tasti.su) p.vy -= NUOTO_SU;
    /* LA CORRENTE NON CAMBIA CON LA DIFFICOLTA'. Scalandola, alla difficoltà
       più bassa diventava più debole della bracciata e si attraversava il
       livello a nuoto, senza legarsi a niente: il banco lo ha misurato
       togliendo tutte le ancore e arrivando lo stesso in fondo. La regola del
       gioco deve valere in tutte le difficoltà; quello che cambia con la
       difficoltà sono i radicali, le vite e le domande. */
    p.vx -= CORRENTE;
    var visc = VISCOSITA * (ab === 'veloce' ? 0.45 : (ab === 'planata' ? 2.4 : 1));
    p.vx *= (1 - visc); p.vy *= (1 - visc);

    /* ── i comandi ─────────────────────────────────────────────────────
       LIBERI si nuota: si spinge a destra o a sinistra contro il solvente, e
       si va piano. LEGATI si SPINGE SULLA CURVA: ▶ fa girare in senso orario,
       ◀ al contrario, e a ogni giro si prende velocità — come ci si dà la
       spinta su un'altalena.

       Il primo disegno teneva la spinta orizzontale anche da legati, ed era
       sbagliato in un modo che si vede solo provando: una forza costante su
       una corda non fa girare niente, sposta il punto di equilibrio e basta.
       Misurato con il pilota automatico: restava appeso a oscillare e in
       settemila passi non arrivava a un decimo del livello. Sulla curva la
       spinta si accumula giro dopo giro, ed è questo che rende il legame una
       fionda invece di un'altalena ferma. */
    var spinta = BRACCIATA / pro.inerzia;
    if (p.legame !== null && liv.ancore[p.legame]) {
      /* sulla curva l'inerzia pesa, ma pesa la RADICE: un atomo di uranio
         deve essere più lento di uno di idrogeno, non immobile. Diviso per
         l'inerzia piena, con l'uranio addosso non si arrivava mai alla
         velocità che serve per lasciare il legame e andarsene. */
      spinta = POMPA / Math.sqrt(pro.inerzia);
      var an0 = liv.ancore[p.legame];
      var ndx = p.x - an0.x, ndy = p.y - an0.y;
      var nd = Math.hypot(ndx, ndy) || 1;
      /* il verso orario, sullo schermo: (−ny, nx) */
      var tx = -ndy / nd, ty = ndx / nd;
      var sp2 = spinta;
      if (tasti.dx) { p.vx += tx * sp2; p.vy += ty * sp2; p.guarda = 1; }
      if (tasti.sx) { p.vx -= tx * sp2; p.vy -= ty * sp2; p.guarda = -1; }
    } else {
      if (tasti.sx) { p.vx -= spinta; p.guarda = -1; }
      if (tasti.dx) { p.vx += spinta; p.guarda = 1; }
    }

    /* ── IL LEGAME ────────────────────────────────────────────────────── */
    if (tasti.su) {
      if (p.legame === null && p.attesa <= 0) {
        var k = ancoraVicina(liv, p.x, p.y, PORTATA, p.ultimo);
        if (k >= 0) {
          var a0 = liv.ancore[k];
          p.legame = k;
          /* e comunque mai tanto lungo da portare l'orbita fuori dai bordi */
          p.raggio = Math.max(18, Math.min(lunghezzaLegame(pro, a0.pro),
                                           Math.hypot(a0.x - p.x, a0.y - p.y),
                                           a0.y - 14, ALTO - a0.y - 14));
          p.raggio0 = p.raggio;
          p.tipo = tipoLegame(pro, a0.pro);
          /* i primi fotogrammi non contano per la tensione: agganciarsi non
             deve spezzare il legame che si sta formando */
          p.grazia = 8;
          bip(p.tipo === 'ionico' ? 320 : 520, 0.05, 'triangle', 0.05);
          particelle(p.x, p.y, COL_LEGAME[p.tipo], 4);
        }
      }
    } else if (p.legame !== null) {
      /* SI LASCIA: si parte per la tangente con quello che si è accumulato.
         E NON CI SI RIATTACCA SUBITO ALLA STESSA ANCORA: finché non se ne
         esce, quella è esclusa. Senza questa regola si resta appesi allo
         stesso atomo per sempre — misurato con un pilota automatico, che
         lasciava e si riagganciava nello stesso fotogramma e in millecinque
         passi non arrivava a un sesto del livello. */
      p.ultimo = p.legame;
      p.legame = null; p.attesa = 6;
      bip(700, 0.04, 'triangle', 0.04);
    }
    if (p.attesa > 0) p.attesa--;

    p.x += p.vx; p.y += p.vy;

    if (p.legame !== null) {
      var a = liv.ancore[p.legame];
      var dx = p.x - a.x, dy = p.y - a.y;
      var d = Math.hypot(dx, dy) || 0.0001;
      /* Il legame ionico tira dentro: non è una corda, è un'attrazione. Ma
         NON FINO A INCOLLARSI: il raggio non scende sotto i due terzi di
         quello di partenza. Senza quel fondo il raggio arrivava al minimo e
         si finiva a girare in un cerchietto di venti pixel, da cui non si
         raggiunge più niente — misurato: il pilota automatico ci restava
         duemilaquattrocento fotogrammi. */
      var rMin = Math.max(22, p.raggio0 * 0.66);
      if (p.tipo === 'ionico') p.raggio = Math.max(rMin, p.raggio - 0.16);
      else if (p.tipo === 'polare') p.raggio = Math.max(rMin, p.raggio - 0.04);
      if (d > p.raggio || p.tipo !== 'covalente') {
        var nx = dx / d, ny = dy / d;
        p.x = a.x + nx * p.raggio; p.y = a.y + ny * p.raggio;
        var radiale = p.vx * nx + p.vy * ny;
        /* la tensione è quella che si toglie alla velocità più la forza che
           tiene in curva: se supera quello che il legame regge, si spezza */
        var tang = Math.hypot(p.vx - radiale * nx, p.vy - radiale * ny);
        var tensione = Math.abs(radiale) + tang * tang / Math.max(12, p.raggio);
        p.vx -= radiale * nx; p.vy -= radiale * ny;
        p.tensione = tensione / pro.tenuta;
        if (p.grazia > 0) { p.grazia--; p.tensione = 0; }
        else if (tensione > pro.tenuta) {
          p.legame = null; p.attesa = 14; p.tensione = 0;
          particelle(p.x, p.y, '#ff6b84', 10);
          bip(140, 0.12, 'sawtooth', 0.07);
          mostraAvviso(t('legame spezzato: troppa tensione',
                         'bond broken: too much tension'), null, null);
        }
      }
    } else p.tensione = 0;

    if (p.ultimo != null && liv.ancore[p.ultimo]) {
      var au = liv.ancore[p.ultimo];
      if (Math.hypot(au.x - p.x, au.y - p.y) > PORTATA) p.ultimo = null;
    }

    var v = Math.hypot(p.vx, p.vy);
    if (v > V_MAX) { p.vx *= V_MAX / v; p.vy *= V_MAX / v; }

    /* ── i bordi della provetta ───────────────────────────────────────── */
    if (p.x < 6) { p.x = 6; p.vx = Math.max(0, p.vx); }
    if (p.x > liv.largo - 8) p.x = liv.largo - 8;
    /* LA SUPERFICIE E IL FONDO NON UCCIDONO SUL COLPO: respingono e fanno
       male. Il primo disegno li faceva uccidere, ed era una condanna: con
       l'idrogeno addosso si sale di un pixel e mezzo al fotogramma e il solo
       modo di fermarsi è un legame — se non c'è un'ancora a portata non c'è
       niente da fare, e un gioco in cui non c'è niente da fare non è
       difficile, è rotto. Misurato con un pilota automatico: su dodici livelli
       quarantasette morti su cinquantasette erano «evaporato». Ora si
       rimbalza, si perde un elemento o una vita come con qualunque altro
       danno, e si ha il tempo di rimediare. */
    if (p.y < 8) {
      p.y = 8; p.vy = Math.abs(p.vy) * 0.4 + 0.3;
      if (p.legame === null) colpito(t('la superficie: stavi evaporando',
                                       'the surface: you were evaporating'));
    }
    if (p.y > ALTO - 8) {
      p.y = ALTO - 8; p.vy = -Math.abs(p.vy) * 0.4 - 0.3;
      if (p.legame === null) colpito(t('il fondo: stavi sedimentando',
                                       'the bottom: you were settling'));
    }
    if (p.x < S.cam - 24) { perdiVita(t('la corrente ti ha portato indietro',
                                        'the current carried you back')); return; }

    /* ── la camera ────────────────────────────────────────────────────── */
    var voluta = p.x - LARGO * 0.38;
    S.cam += (voluta - S.cam) * 0.12;
    S.cam = Math.max(0, Math.min(liv.largo - LARGO, S.cam));

    /* ── sparare ──────────────────────────────────────────────────────── */
    if (tasti.fuoco && SPARA[ab] && (p.ricarica || 0) <= 0) {
      var forzaC = SPARA[ab];
      var n = (ab === 'quattro') ? 4 : 1;
      var dir = p.guarda || 1;
      for (var s2 = 0; s2 < n; s2++) {
        S.proiettili.push({
          x: p.x + dir * 8, y: p.y + (n > 1 ? (s2 - 1.5) * 3 : 0),
          vx: dir * 4.4, vy: (n > 1 ? (s2 - 1.5) * 0.55 : 0),
          forza: forzaC, perfora: ab === 'perfora', vivo: true, t: 0
        });
      }
      p.ricarica = ab === 'forte' ? 18 : 11;
      bip(ab === 'forte' ? 900 : 660, 0.05, 'sawtooth', 0.05);
    }
    if (p.ricarica > 0) p.ricarica--;

    /* i poteri ad area: Cl pulisce, U e Na danneggiano quello che hanno intorno */
    if (ab === 'pulisci' || ab === 'radio' || ab === 'esplodi') {
      var raggio = ab === 'pulisci' ? 46 : 34;
      liv.nemici.forEach(function (e) {
        if (!e.vivo) return;
        if (Math.abs(e.x - p.x) < raggio && Math.abs(e.y - p.y) < raggio) {
          if ((p.areaT || 0) <= 0) uccidi(e);
        }
      });
      if ((p.areaT || 0) <= 0) p.areaT = ab === 'pulisci' ? 40 : 70;
    }
    if (p.areaT > 0) p.areaT--;

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
          Math.abs(S.boss.x - b.x) < 24 && Math.abs(S.boss.y - b.y) < 24) {
        S.boss.vita -= b.forza;
        S.boss.colpito = 10;
        b.vivo = false;
        bip(180, 0.1, 'square', 0.08);
        if (S.boss.vita <= 0) vinciLivello();
      }
    });
    S.proiettili = S.proiettili.filter(function (b) { return b.vivo; });

    /* ── le bolle: chi le prende sale ─────────────────────────────────── */
    liv.bolle.forEach(function (bo) {
      bo.y -= bo.v;
      if (bo.y < -8) { bo.y = ALTO + 8; }
      if (Math.abs(bo.x - p.x) < bo.r + 8 && Math.abs(bo.y - p.y) < bo.r + 8) {
        p.vy -= 0.1;
      }
    });

    /* ── i cristalli: fermi e taglienti ───────────────────────────────── */
    liv.cristalli.forEach(function (cr) {
      if (cr.rotto) return;
      if (Math.abs(cr.x - p.x) < cr.r + 6 && Math.abs(cr.y - p.y) < cr.r + 6) {
        /* il ferro è pesante: affondando ci passa attraverso */
        if (ab === 'tuffo' && p.vy > 1.4) {
          cr.rotto = true; particelle(cr.x, cr.y, '#9fe8ff', 10);
          S.punti += 30 * S.moltiplicatore;
          bip(220, 0.08, 'square', 0.06);
        } else if (S.invincibile > 0 || ab === 'invinc') { /* niente */ }
        else colpito();
      }
    });

    /* ── i radicali ───────────────────────────────────────────────────── */
    var lento = (ab === 'rallenta') ? 0.45 : 1;
    liv.nemici.forEach(function (e) {
      if (!e.vivo) return;
      if (Math.abs(e.x - p.x) > LARGO) return;      /* fuori scena: fermi */
      e.t++;
      if (e.tipo === 'insegue') {
        var ddx = p.x - e.x, ddy = p.y - e.y, dd = Math.hypot(ddx, ddy) || 1;
        e.vx += (ddx / dd) * 0.012 * S.diff.vel;
        e.vy += (ddy / dd) * 0.012 * S.diff.vel;
        var ve = Math.hypot(e.vx, e.vy), vm = 1.1 * S.diff.vel;
        if (ve > vm) { e.vx *= vm / ve; e.vy *= vm / ve; }
      } else {
        e.vy += Math.sin(e.t / 30) * 0.012;
      }
      e.x += e.vx * lento; e.y += e.vy * lento;
      if (e.y < 12 || e.y > ALTO - 12) e.vy = -e.vy;
      /* contatto */
      if (Math.abs(e.x - p.x) < 11 && Math.abs(e.y - p.y) < 11) {
        /* COLPIRLO DI SLANCIO LO DISSOCIA: è la grammatica di questo gioco —
           non si salta sopra a nessuno, si arriva addosso con la velocità
           che il legame ti ha dato */
        if (Math.hypot(p.vx, p.vy) > 2.6) {
          uccidi(e);
          p.vx *= -0.35; p.vy *= -0.35;
        } else if (ab === 'inerte' && e.ossidante) {
          /* l'oro non si ossida: quel radicale non lo tocca */
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
      /* DA VICINO SI FA PRENDERE. Passare a cinque pixel da un elemento e non
         raccoglierlo, mentre si vola appesi a un legame, è una frustrazione
         gratuita: qui non si mira, si passa. Misurato: senza questo, in
         cinquemila passi il pilota non ne raccoglieva nemmeno uno. */
      var dxe = p.x - el.x, dye = p.y - el.y;
      var de = Math.hypot(dxe, dye);
      if (de < 46 && de > 1) { el.x += (dxe / de) * 0.9; el.y += (dye / de) * 0.9; }
      if (Math.abs(el.x - p.x) < 14 && Math.abs(el.y - p.y) < 14) {
        el.preso = true;
        prendi(el);
      }
    });

    /* ── le membrane: la domanda ──────────────────────────────────────── */
    liv.controlli.forEach(function (c) {
      if (c.fatto) return;
      if (p.x >= c.x) {
        c.fatto = true;
        apriDomanda();
      }
    });

    /* ── il boss: uno ione grosso che tira a sé ───────────────────────── */
    if (S.boss) {
      var bo2 = S.boss;
      if (!bo2.attivo && p.x > bo2.x - LARGO * 0.6) {
        bo2.attivo = true;
        bip(110, 0.4, 'sawtooth', 0.08);
      }
      if (bo2.attivo) {
        bo2.t++;
        if (bo2.colpito > 0) bo2.colpito--;
        if (bo2.vita <= bo2.max / 2) bo2.fase = 2;
        var vb = (bo2.fase === 2 ? 1.5 : 0.9) * S.diff.vel;
        bo2.y += Math.sin(bo2.t / 42) * vb;
        bo2.y = Math.max(40, Math.min(ALTO - 40, bo2.y));
        /* attrae: più sei vicino, più tira. È uno ione */
        var bx = bo2.x - p.x, by = bo2.y - p.y, bd = Math.hypot(bx, by) || 1;
        if (bd < 150) {
          var f = 0.05 * (1 - bd / 150) * S.diff.vel;
          p.vx += (bx / bd) * f; p.vy += (by / bd) * f;
        }
        if (bd < 26) {
          if (Math.hypot(p.vx, p.vy) > 3.2) {
            /* addosso di slancio: lo si ionizza */
            bo2.vita -= 1; bo2.colpito = 10;
            p.vx = -bx / bd * 3.4; p.vy = -by / bd * 3.4;
            S.invincibile = Math.max(S.invincibile, 24);
            particelle(bo2.x, bo2.y, '#ffd93d', 12);
            bip(200, 0.12, 'square', 0.08);
            if (bo2.vita <= 0) vinciLivello();
          } else if (S.invincibile > 0 || ab === 'invinc') { /* niente */ }
          else colpito();
        }
      }
    } else if (p.x > liv.largo - 40) {
      vinciLivello();
    }

    if (S.invincibile > 0) S.invincibile--;
    S.particelle.forEach(function (q) { q.x += q.vx; q.y += q.vy; q.vy *= 0.96; q.t--; });
    S.particelle = S.particelle.filter(function (q) { return q.t > 0; });
    /* la scia: dice da dove si arriva, e in un gioco di fionde serve */
    p.scia.push({ x: p.x, y: p.y });
    if (p.scia.length > 14) p.scia.shift();
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
    /* DIVENTARE UN ELEMENTO QUI VUOL DIRE CAMBIARE FISICA, non colore: massa,
       raggio, elettronegatività ed energia di ionizzazione entrano subito nel
       galleggiamento, nella lunghezza dei legami e in quanto reggono. */
    S.profilo = profilo(el.sim);
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

  function colpito(perche) {
    if (S.p.immune > 0) return;
    if (abilita() === 'schermo' && Math.random() < 0.5) { S.p.immune = 40; return; }
    if (S.scudo > 0) {
      S.scudo--;
      S.p.immune = 60;
      bip(200, 0.14, 'square', 0.07);
      if (abilita() === 'scudo2') setTimeout(function () { if (S) S.scudo = 1; }, 4000);
      return;
    }
    perdiVita(perche || t('ti ha preso un radicale', 'a radical got you'));
  }

  function perdiVita(perche) {
    S.vite--;
    S.perche = perche;          /* l'ultima causa: serve a chi gioca e al banco */
    S.elemento = null; S.scudo = 0; S.moltiplicatore = 1;
    S.profilo = profilo(null);
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
    /* IL GIOCO, SULLA COPERTINA. Non un omino che corre: un atomo appeso a un
       legame che gira intorno a un'ancora e poi parte per la tangente. È la
       sola cosa che si fa in questo gioco, e si vede prima di cominciare. */
    /* IN BASSO A SINISTRA, e non al centro: al centro ci sono i due pulsanti,
       e un'animazione dietro un pulsante non la vede nessuno. Misurato
       guardando la copertina: l'atomo girava esattamente sotto «GIOCA». */
    var cy = ALTO - 46;
    var ax = 42 + Math.sin(tTit / 160) * 10;
    var pt = POTERI[Math.floor(tTit / 150) % POTERI.length];
    var colT = COLORI[pt.ab] || '#5eead4';
    var ang = tTit / 26;
    var rag = 23 + Math.sin(tTit / 90) * 4;
    var ox3 = ax + Math.cos(ang) * rag, oy3 = cy + Math.sin(ang) * rag;
    ctx.strokeStyle = 'rgba(94,234,212,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, cy); ctx.lineTo(ox3, oy3); ctx.stroke();
    for (var q3 = 1; q3 < 5; q3++) {
      var tq = q3 / 5;
      ctx.fillStyle = '#5eead4';
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(tTit / 7 + q3));
      ctx.fillRect(Math.round(ax + (ox3 - ax) * tq) - 1,
                   Math.round(cy + (oy3 - cy) * tq) - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
    disegnaAtomo(ax, cy, 7, '#7f9ec2', 2, tTit, 'C');
    disegnaAtomo(ox3, oy3, 6, colT, 2, tTit * 1.6, null);
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(ox3 - 3), Math.round(oy3 - 2), 2, 2);
    ctx.fillRect(Math.round(ox3 + 1), Math.round(oy3 - 2), 2, 2);
    scrivi(pt.sim, Math.round(ox3) - 4, Math.round(oy3) - 18, 1, colT,
           'rgba(3,12,20,.85)');

    /* che cos'è questo gioco, in una riga. Sta QUI, sotto il sottotitolo, e
       non in fondo: il terzo inferiore della tela è occupato dai due pulsanti
       veri, e un testo disegnato lì sotto ci finisce dietro — misurato in una
       finestra da telefono. Non c'è nemmeno un «PREMI GIOCA» che lampeggia:
       il pulsante GIOCA è lì sotto e dice già la stessa cosa. */
    scriviCentrato(LIVELLI + ' ' + t('LIVELLI', 'LEVELS') + ' · 4 BOSS · ' +
                   POTERI.length + ' ' + t('ELEMENTI', 'ELEMENTS'),
                   yN + 7 * k1 + 32, 1, '#9ab4cc', 'rgba(3,12,20,.9)');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL DISEGNO

     Non c'e' un prato con delle nuvole: c'e' un LIQUIDO. Il fondo e' una
     colonna di solvente con le sue bollicine e le sue righe di corrente che
     scorrono all'indietro; gli atomi sono nuclei con i loro gusci di
     elettroni che girano davvero (quanti gusci lo dice il PERIODO della
     tavola periodica, non un numero inventato); il legame e' una catena di
     elettroni che pulsa, e il suo colore dice che legame e'.

     Il personaggio e' un ATOMO con due occhi, non un omino: guarda dove va, e
     quando prende un elemento cambia colore, dimensione e numero di gusci —
     perche' e' diventato quell'atomo per davvero, numeri compresi.
     ═════════════════════════════════════════════════════════════════════════ */
  var FONDI = [
    ['#071d33', '#0d3350'], ['#140b2c', '#2c1a4d'],
    ['#2a1206', '#4d2a14'], ['#04161a', '#0a3838']
  ];

  function disegnaAtomo(x, y, r, colore, gusci, fase, sim, chiaro) {
    /* il nucleo */
    ctx.fillStyle = colore;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.34, 0, 6.2832); ctx.fill();
    /* i gusci: uno per periodo, con gli elettroni che girano */
    for (var g = 1; g <= gusci; g++) {
      var rg = r + 4 + g * 3.5;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.13 - g * 0.012).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, rg, 0, 6.2832); ctx.stroke();
      var quanti = Math.min(6, 1 + g);
      for (var e = 0; e < quanti; e++) {
        var an = fase / (9 + g * 4) + (e / quanti) * 6.2832 + g;
        ctx.fillStyle = chiaro || 'rgba(190,235,255,.85)';
        ctx.fillRect(Math.round(x + Math.cos(an) * rg) - 1,
                     Math.round(y + Math.sin(an) * rg) - 1, 2, 2);
      }
    }
    if (sim) {
      ctx.fillStyle = '#04101e';
      ctx.font = 'bold ' + Math.max(7, Math.round(r)) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sim, x, y + r * 0.38);
    }
  }

  function disegna() {
    if (!ctx) return;
    /* sul titolo si disegna il titolo: è una schermata del gioco, non una
       pagina HTML travestita */
    if (schermo === 'titolo') { disegnaTitolo(); return; }
    var liv = S && S.liv;
    ctx.imageSmoothingEnabled = false;
    var zona = liv ? liv.zona : 1;
    var f = FONDI[(zona - 1) % 4];
    var g = ctx.createLinearGradient(0, 0, 0, ALTO);
    g.addColorStop(0, f[1]); g.addColorStop(1, f[0]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, LARGO, ALTO);
    if (!liv) return;

    var cam = Math.round(S.cam);
    var p = S.p, pro = S.profilo;
    var col = S.elemento ? (COLORI[S.elemento.ab] || '#8be9fd') : '#9fe8ff';

    /* ── il solvente: righe di corrente che scorrono indietro ──────────── */
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    for (var r0 = 0; r0 < 16; r0++) {
      var yr = (r0 * 37 + (p.anim * 0.25) % 37) % ALTO;
      var xr = (-(cam * 0.6) + r0 * 91) % (LARGO + 120) - 60;
      ctx.beginPath(); ctx.moveTo(xr, yr); ctx.lineTo(xr + 26, yr); ctx.stroke();
    }
    /* bollicine di fondo, lente: profondità a costo zero */
    for (var b0 = 0; b0 < 26; b0++) {
      var bx = ((b0 * 173) - cam * 0.35) % (LARGO + 40) - 20;
      if (bx < -20) bx += LARGO + 40;
      var by = (ALTO - ((p.anim * 0.3 + b0 * 53) % (ALTO + 20)));
      ctx.fillStyle = 'rgba(255,255,255,.055)';
      ctx.beginPath(); ctx.arc(bx, by, 1 + (b0 % 3), 0, 6.2832); ctx.fill();
    }

    /* i due bordi pericolosi: la superficie e il fondo. Si devono VEDERE,
       perché fanno male */
    var gs = ctx.createLinearGradient(0, 0, 0, 22);
    gs.addColorStop(0, 'rgba(159,232,255,.22)'); gs.addColorStop(1, 'rgba(159,232,255,0)');
    ctx.fillStyle = gs; ctx.fillRect(0, 0, LARGO, 22);
    var gf = ctx.createLinearGradient(0, ALTO - 22, 0, ALTO);
    gf.addColorStop(0, 'rgba(120,90,60,0)'); gf.addColorStop(1, 'rgba(120,90,60,.35)');
    ctx.fillStyle = gf; ctx.fillRect(0, ALTO - 22, LARGO, 22);

    /* ── le membrane dei punti di controllo ────────────────────────────── */
    liv.controlli.forEach(function (c) {
      var x = c.x - cam;
      if (x < -10 || x > LARGO + 10) return;
      ctx.strokeStyle = c.fatto ? 'rgba(94,234,212,.3)' : 'rgba(255,217,61,.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var yy = 0; yy < ALTO; yy += 6) {
        ctx.moveTo(x + Math.sin((yy + p.anim) / 14) * 3, yy);
        ctx.lineTo(x + Math.sin((yy + p.anim) / 14) * 3, yy + 3);
      }
      ctx.stroke();
    });

    /* ── le bolle ──────────────────────────────────────────────────────── */
    liv.bolle.forEach(function (bo) {
      var x = bo.x - cam;
      if (x < -20 || x > LARGO + 20) return;
      ctx.strokeStyle = 'rgba(190,240,255,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, bo.y, bo.r, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(x - bo.r * 0.3, bo.y - bo.r * 0.35, bo.r * 0.3, 0, 6.2832);
      ctx.fill();
    });

    /* ── i cristalli ───────────────────────────────────────────────────── */
    liv.cristalli.forEach(function (cr) {
      if (cr.rotto) return;
      var x = cr.x - cam;
      if (x < -24 || x > LARGO + 24) return;
      ctx.fillStyle = 'rgba(159,232,255,.22)';
      ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var k2 = 0; k2 < 6; k2++) {
        var aa = (k2 / 6) * 6.2832 + cr.t / 100;
        var rr = cr.r * (k2 % 2 ? 0.62 : 1);
        var px2 = x + Math.cos(aa) * rr, py2 = cr.y + Math.sin(aa) * rr;
        if (k2) ctx.lineTo(px2, py2); else ctx.moveTo(px2, py2);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });

    /* ── le ancore, e quale si può agganciare ──────────────────────────── */
    var vicina = ancoraVicina(liv, p.x, p.y, PORTATA);
    liv.ancore.forEach(function (a, k3) {
      var x = a.x - cam;
      if (x < -40 || x > LARGO + 40) return;
      if (k3 === vicina && p.legame === null) {
        /* SI VEDE A CHE COSA CI SI PUÒ LEGARE. Senza questo segno si tiene
           premuto sperando: un gioco in cui non si sa che cosa succederà */
        ctx.strokeStyle = 'rgba(94,234,212,.5)'; ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(x, a.y, a.pro.corpo + 9 + Math.sin(p.anim / 9) * 1.5,
                                 0, 6.2832); ctx.stroke();
        ctx.setLineDash([]);
      }
      disegnaAtomo(x, a.y, a.pro.corpo, k3 === vicina ? '#9fc4e8' : '#6f8fb3',
                   Math.min(3, a.pro.gusci), a.t + p.anim, a.sim,
                   'rgba(190,235,255,.5)');
    });

    /* ── il legame ─────────────────────────────────────────────────────── */
    if (p.legame !== null && liv.ancore[p.legame]) {
      var an2 = liv.ancore[p.legame];
      var ax = an2.x - cam, ay = an2.y;
      var px3 = p.x - cam, py3 = p.y;
      var cl = COL_LEGAME[p.tipo] || '#5eead4';
      ctx.strokeStyle = cl; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px3, py3); ctx.stroke();
      ctx.globalAlpha = 1;
      /* gli elettroni del legame, che corrono avanti e indietro */
      var passi = Math.max(3, Math.round(p.raggio / 7));
      for (var q2 = 1; q2 < passi; q2++) {
        var tt = q2 / passi;
        var ox = ax + (px3 - ax) * tt, oy = ay + (py3 - ay) * tt;
        var bri = 0.35 + 0.65 * Math.abs(Math.sin(p.anim / 7 + q2));
        ctx.fillStyle = cl; ctx.globalAlpha = bri;
        ctx.fillRect(Math.round(ox) - 1, Math.round(oy) - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
      /* la tensione, dove serve guardarla: sul legame */
      if (p.tensione > 0.45) {
        ctx.strokeStyle = p.tensione > 0.8 ? '#ff6b84' : '#ffd93d';
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(p.anim / 3);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px3, py3); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
      }
    }

    /* ── gli elementi da raccogliere ───────────────────────────────────── */
    liv.elementi.forEach(function (el) {
      if (el.preso) return;
      el.t++;
      var x = el.x - cam;
      if (x < -24 || x > LARGO + 24) return;
      var y = el.y + Math.sin(el.t / 18) * 3;
      ctx.strokeStyle = COLORI[el.ab] || '#fff'; ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(x, y, 11 + Math.sin(el.t / 12) * 1.5, 0, 6.2832);
      ctx.stroke(); ctx.globalAlpha = 1;
      disegnaAtomo(x, y, 7, COLORI[el.ab] || '#fff', 1, el.t * 2, el.sim);
    });

    /* ── i radicali: un elettrone spaiato, e si vede ───────────────────── */
    liv.nemici.forEach(function (e) {
      if (!e.vivo) return;
      var x = e.x - cam;
      if (x < -20 || x > LARGO + 20) return;
      var ce = e.ossidante ? '#ff5f7e' : '#b06bff';
      ctx.fillStyle = ce;
      ctx.beginPath(); ctx.arc(x, e.y, 6, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#06131f';
      ctx.fillRect(Math.round(x) - 3, Math.round(e.y) - 2, 2, 2);
      ctx.fillRect(Math.round(x) + 1, Math.round(e.y) - 2, 2, 2);
      /* l'elettrone spaiato: il punto che gira da solo */
      var ae = e.t / 9;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(x + Math.cos(ae) * 10) - 1,
                   Math.round(e.y + Math.sin(ae) * 10) - 1, 2, 2);
    });

    /* ── i proiettili ──────────────────────────────────────────────────── */
    ctx.fillStyle = '#ffe066';
    S.proiettili.forEach(function (b) {
      ctx.fillRect(b.x - cam - 2, b.y - 1, 5, 2);
    });

    /* ── il boss: uno ione grosso ──────────────────────────────────────── */
    if (S.boss && S.boss.attivo) {
      var bo3 = S.boss, bx2 = bo3.x - cam;
      var cb = bo3.colpito > 0 ? '#ffffff' : (liv.finale ? '#ff3b5c' : '#c44bff');
      /* il campo che tira: si vede fin dove arriva */
      ctx.strokeStyle = 'rgba(255,107,132,.16)';
      ctx.beginPath(); ctx.arc(bx2, bo3.y, 150, 0, 6.2832); ctx.stroke();
      disegnaAtomo(bx2, bo3.y, 17, cb, 3, bo3.t * 2, null, 'rgba(255,200,220,.9)');
      ctx.fillStyle = '#06131f';
      ctx.fillRect(Math.round(bx2) - 8, Math.round(bo3.y) - 5, 5, 5);
      ctx.fillRect(Math.round(bx2) + 3, Math.round(bo3.y) - 5, 5, 5);
      ctx.fillRect(Math.round(bx2) - 7, Math.round(bo3.y) + 5, 14, 2);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(LARGO / 2 - 60, 10, 120, 7);
      ctx.fillStyle = '#ff5f7e';
      ctx.fillRect(LARGO / 2 - 59, 11, 118 * Math.max(0, bo3.vita / bo3.max), 5);
    }

    /* ── le particelle ─────────────────────────────────────────────────── */
    S.particelle.forEach(function (q) {
      ctx.fillStyle = q.c; ctx.fillRect(q.x - cam, q.y, 2, 2);
    });

    /* ── IL GIOCATORE ──────────────────────────────────────────────────── */
    var px4 = p.x - cam;
    if (!(p.immune > 0 && Math.floor(p.immune / 4) % 2)) {
      /* la scia */
      p.scia.forEach(function (sp, k4) {
        ctx.fillStyle = col;
        ctx.globalAlpha = (k4 / p.scia.length) * 0.22;
        ctx.beginPath(); ctx.arc(sp.x - cam, sp.y, pro.corpo * 0.7, 0, 6.2832); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (S.invincibile > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + 0.2 * Math.sin(p.anim / 3)) + ')';
        ctx.beginPath(); ctx.arc(px4, p.y, pro.corpo + 7, 0, 6.2832); ctx.fill();
      }
      /* UN ALONE INTORNO AL GIOCATORE. Su un fondo pieno di atomi grigi, un
         atomo colorato da sei pixel si perde: misurato guardando una
         schermata di gioco e non trovandolo. L'alone lo stacca da tutto. */
      ctx.strokeStyle = col; ctx.globalAlpha = 0.35; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px4, p.y, pro.corpo + 2, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
      disegnaAtomo(px4, p.y, pro.corpo, col, pro.gusci, p.anim, null, col);
      ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(px4, p.y, pro.corpo, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
      /* gli occhi guardano dove si va: è quello che rende un atomo un
         personaggio invece che un pallino */
      var vv = Math.hypot(p.vx, p.vy) || 1;
      var ox2 = (p.vx / vv) * 1.6, oy2 = (p.vy / vv) * 1.6;
      var ro = Math.max(1, Math.round(pro.corpo / 3.4));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(px4 - pro.corpo * 0.42), Math.round(p.y - 2), ro + 1, ro + 1);
      ctx.fillRect(Math.round(px4 + pro.corpo * 0.1), Math.round(p.y - 2), ro + 1, ro + 1);
      ctx.fillStyle = '#06131f';
      ctx.fillRect(Math.round(px4 - pro.corpo * 0.42 + ox2), Math.round(p.y - 2 + oy2), ro, ro);
      ctx.fillRect(Math.round(px4 + pro.corpo * 0.1 + ox2), Math.round(p.y - 2 + oy2), ro, ro);
      if (S.elemento) {
        ctx.fillStyle = col;
        ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
        ctx.fillText(S.elemento.sim, px4, p.y - pro.corpo - 7);
      }
      if (S.scudo > 0) {
        ctx.strokeStyle = '#8be9fd'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px4, p.y, pro.corpo + 10, 0, 6.2832); ctx.stroke();
      }
    }

    /* ── il quadro comandi ─────────────────────────────────────────────── */
    ctx.fillStyle = 'rgba(4,12,22,.72)'; ctx.fillRect(0, 0, LARGO, 20);
    ctx.fillStyle = '#eaf6ff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('♥'.repeat(Math.max(0, S.vite)), 6, 14);
    ctx.textAlign = 'center';
    ctx.fillText(t('ZONA ', 'ZONE ') + liv.zona + ' · ' + t('LIV ', 'LVL ') +
                 S.livello + '/' + LIVELLI, LARGO / 2, 14);
    ctx.textAlign = 'right';
    ctx.fillText(String(S.punti).padStart(6, '0') +
                 (S.moltiplicatore > 1 ? ' ×' + S.moltiplicatore : ''), LARGO - 6, 14);
    /* quanto manca alla fine della provetta: in un gioco di corrente serve
       sapere se si sta andando avanti o indietro */
    var av = Math.max(0, Math.min(1, p.x / liv.largo));
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(0, 20, LARGO, 2);
    ctx.fillStyle = '#5eead4'; ctx.fillRect(0, 20, LARGO * av, 2);
    if (S.elemento) {
      ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.font = 'bold 10px monospace';
      ctx.fillText(S.elemento.sim + ' ' + S.elemento.nome + '  ' +
                   (pro.sale > 0 ? '↑' : '↓') + ' ' + pro.massa.toFixed(2) + ' u',
                   6, ALTO - 6);
    } else {
      ctx.fillStyle = '#7fa0bb'; ctx.textAlign = 'left'; ctx.font = 'bold 10px monospace';
      ctx.fillText(t('atomo neutro · nessun elemento raccolto',
                     'neutral atom · no element yet'), 6, ALTO - 6);
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
    mettiIcona();
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
      /* L'ICONA, DOVE SI VEDE. Entra come sfondo di uno pseudo-elemento e non
         come `<img>`: il cambio lingua riscrive il testo di questi due nodi, e
         riscrivendolo porterebbe via qualunque figlio. Lo pseudo-elemento il
         testo non lo tocca. `image-rendering:pixelated` perché un'icona a
         pixel ingrandita con l'interpolazione diventa una macchia. */
      '.nav-btn[data-s="' + ID + '"]::before,#' + ID + ' .section-title::before{',
      ' content:"";display:inline-block;vertical-align:-0.22em;margin-right:7px;',
      ' background-image:var(--bsiG-ico);background-size:contain;',
      ' background-repeat:no-repeat;image-rendering:pixelated;',
      ' width:1.15em;height:1.15em}',
      '#' + ID + ' .section-title::before{width:1.5em;height:1.5em;',
      ' vertical-align:-0.35em}',
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
      '<div class="section-title">' + NOME + ' — ' +
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
      'Un gioco che non si gioca come gli altri: sei un <b>atomo in soluzione</b> ' +
      'e <b>non c’è terreno</b> — ci si muove <b>legandosi</b> agli atomi che si ' +
      'incontrano, girandoci intorno e lasciando il legame al momento giusto per ' +
      'partire per la tangente. Una corrente ti spinge indietro più forte di quanto ' +
      'tu sappia nuotare — <b>si avanza solo con i legami</b> — la tua <b>massa</b> ' +
      'decide quanto affondi, i <b>raggi atomici</b> decidono quanto è lungo il ' +
      'legame e l’<b>energia di ionizzazione</b> quanto regge prima di spezzarsi: ' +
      'i numeri veri della tavola periodica di questa applicazione sono le regole ' +
      'del gioco. Dodici livelli, quattro zone, un boss alla fine di ogni zona. Ai ' +
      '<b>punti di controllo</b> arriva una domanda di chimica — generata dalle ' +
      'tabelle di questa applicazione, non scritta a mano. Il tasto <b>❚❚</b> (o ' +
      '<b>Esc</b>) apre la pausa: lì dentro ci sono la guida, il cambio lingua, il ' +
      'suono e lo schermo pieno. Funziona anche <b>offline</b>: non c’è niente da ' +
      'scaricare.',
      'A game that is not played like the others: you are an <b>atom in solution</b> ' +
      'and <b>there is no ground</b> — you move by <b>bonding</b> to the atoms you ' +
      'meet, orbiting them and letting go at the right moment to fly off along the ' +
      'tangent. A current pushes you back harder than you can swim — <b>bonds are the ' +
      'only way forward</b> — your <b>mass</b> decides how fast you sink, <b>atomic radii</b> decide how long the bond is and <b>ionisation ' +
      'energy</b> how much it holds before snapping: the real numbers from this ' +
      'application’s periodic table are the rules of the game. Twelve levels, four ' +
      'zones, a boss at the end of each. At the <b>checkpoints</b> a chemistry ' +
      'question arrives — generated from this application’s own tables, not ' +
      'hand-written. The <b>❚❚</b> key (or <b>Esc</b>) opens the pause menu: the ' +
      'guide, the language switch, the sound and full screen are in there. It works ' +
      '<b>offline</b> too: there is nothing to download.');
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
  /* LA GUIDA STA IN UNA FUNZIONE SOLA perché si legge da due posti: dal
     titolo («come si gioca») e dal menù di pausa. Due copie dello stesso
     testo sono due testi che un giorno diranno cose diverse. */
  function guida() {
    return t(
      'Sei un <b>atomo</b> dentro una provetta, e qui non si cammina e non si ' +
      'salta: <b>non c’è terreno</b>. Ci si muove come si muove un atomo in ' +
      'soluzione.<br><br>' +
      '<b>⚛ tieni premuto</b>: sali, e se passa un atomo a portata (quello con ' +
      'il cerchietto tratteggiato) ti ci <b>leghi</b> e cominci a girargli ' +
      'intorno. <b>Lascia</b> e parti <b>per la tangente</b> con tutta la ' +
      'velocità accumulata. Questo è il movimento: una <b>fionda fatta di ' +
      'legami</b>.<br>' +
      '<b>◀ ▶</b> da legato ti fanno <b>girare</b> — ▶ in senso orario, ◀ al ' +
      'contrario — e a ogni giro prendi velocità, come su un’altalena. Da ' +
      'libero servono a poco: la corrente è più forte della bracciata, e <b>a ' +
      'nuoto non si avanza</b>. <b>✦</b> usa l’abilità dell’elemento.' +
      '<br>Da tastiera: <b>frecce</b> o <b>A/D</b>, <b>spazio</b> lega e sale, ' +
      '<b>K</b> agisce.<br><br>' +
      'La <b>corrente</b> ti spinge sempre indietro: se ti porta fuori dallo ' +
      'schermo, perdi una vita. L’unico modo di guadagnare terreno è il legame.' +
      '<br><br>' +
      'Lasciando il tasto <b>affondi</b>, e quanto dipende dalla tua <b>massa</b>: ' +
      'l’idrogeno quasi galleggia, il piombo precipita. La <b>superficie</b> e il ' +
      '<b>fondo</b> fanno male: ti respingono e ti costano l’elemento, o una vita ' +
      'se non ne hai.<br><br>' +
      'Il <b>legame si spezza</b> se tiri troppo: quanto regge viene ' +
      'dall’<b>energia di ionizzazione</b> del tuo elemento, e il colore dice ' +
      'che legame è — <span style="color:#5eead4">covalente</span> (gira libero), ' +
      '<span style="color:#ffd93d">polare</span> (tira un po’ dentro), ' +
      '<span style="color:#ff6bd6">ionico</span> (tira forte).<br><br>' +
      'I <b>radicali</b> si dissociano addosso <b>di slancio</b> (velocità sopra ' +
      '2,6): non si salta sopra a nessuno. Ai <b>punti di controllo</b> (le ' +
      'membrane) arriva una domanda. Da «reazione esotermica» in su, sbagliare ' +
      'costa l’elemento — o una vita se non ne hai.',

      'You are an <b>atom</b> inside a test tube, and here you do not walk and do ' +
      'not jump: <b>there is no ground</b>. You move the way an atom moves in ' +
      'solution.<br><br>' +
      '<b>⚛ hold</b>: you rise, and if an atom comes within range (the one with ' +
      'the dashed circle) you <b>bond</b> to it and start orbiting. <b>Let go</b> ' +
      'and you fly off <b>along the tangent</b> with all the speed you built up. ' +
      'That is the movement: a <b>slingshot made of bonds</b>.<br>' +
      '<b>◀ ▶</b> while bonded make you <b>spin</b> — ▶ clockwise, ◀ the other ' +
      'way — and each turn adds speed, like pumping a swing. While free they do ' +
      'little: the current is stronger than your stroke, and <b>swimming gets you ' +
      'nowhere</b>. <b>✦</b> uses the element’s ability.' +
      '<br>Keyboard: <b>arrows</b> or <b>A/D</b>, <b>space</b> bonds and rises, ' +
      '<b>K</b> acts.<br><br>' +
      'The <b>current</b> always pushes you back: if it carries you off screen, ' +
      'you lose a life. The only way to gain ground is the bond.<br><br>' +
      'Let the key go and you <b>sink</b>, as fast as your <b>mass</b> says: ' +
      'hydrogen almost floats, lead drops. The <b>surface</b> and the <b>bottom</b> ' +
      'hurt: they push you back and cost you the element, or a life if you have ' +
      'none.<br><br>' +
      'The <b>bond breaks</b> if you pull too hard: how much it holds comes from ' +
      'your element’s <b>ionisation energy</b>, and the colour says which bond it ' +
      'is — <span style="color:#5eead4">covalent</span> (free to spin), ' +
      '<span style="color:#ffd93d">polar</span> (pulls in a little), ' +
      '<span style="color:#ff6bd6">ionic</span> (pulls hard).<br><br>' +
      '<b>Radicals</b> are dissociated by hitting them <b>with momentum</b> (speed ' +
      'above 2.6): you do not jump on anything here. At the <b>checkpoints</b> ' +
      '(the membranes) a question arrives. From "exothermic reaction" upwards, a ' +
      'wrong answer costs the element — or a life if you have none.');
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
          t('tieni premuto per legarti all’atomo vicino',
            'hold to bond to the nearby atom') + '">⚛</button>' +
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
    /* IL PULSANTE PORTA IL NOME, NON LA PAROLA «GIOCO». Un nome proprio è lo
       stesso in tutte le lingue, e nei dizionari c'è scritto così: la voce
       esiste e vale se stessa, perché la copertura delle lingue si MISURA
       contando i nodi tradotti, e un nodo saltato sarebbe un buco finto. */
    b.textContent = NOME;
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
    if (b) b.textContent = NOME;
    var c = document.getElementById('bsiG-comandi');
    if (c) { c.removeAttribute('data-bsi-pronti'); comandi(); }
    disegnaUI();
  });

  globale.BSIGioco = {
    ID: ID, LARGO: LARGO, ALTO: ALTO, POTERI: POTERI, SPARA: SPARA,
    DIFFICOLTA: DIFFICOLTA, generaLivello: generaLivello,
    applica: applica, nuovaPartita: nuovaPartita, caricaLivello: caricaLivello,
    Caso: Caso, NOME: NOME, FONT: FONT, LIVELLI: LIVELLI, guida: guida,
    COLORI: COLORI, icona: icona, profilo: profilo, tipoLegame: tipoLegame,
    ancoraVicina: ancoraVicina, lunghezzaLegame: lunghezzaLegame,
    PORTATA: PORTATA, DIST_MAX: DIST_MAX, M_ARIA: M_ARIA,
    disegnaAtomo: disegnaAtomo,
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
