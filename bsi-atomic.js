/* ═══════════════════════════════════════════════════════════════════════════
   bsi-atomic.js — ATOMIC PROTOCOL
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COS'E'

   Un gioco di esplorazione in tre dimensioni, in terza o in prima persona,
   con la grafica di una PlayStation 1: un chimico attraversa i reparti di un
   istituto sigillato, raccoglie ELEMENTI, li SINTETIZZA in composti e usa la
   chimica vera per aprire le porte e abbattere i guardiani.

   Non e' un runner. Non si corre da soli e non si va «avanti e basta»: si
   cammina, ci si guarda intorno, si torna indietro, si apre una paratia che
   prima era chiusa perche' adesso si ha l'acido giusto.

   LO STILE PS1 E' FATTO DI LIMITI, E I LIMITI SI RIFANNO APPOSTA

     · la scena si disegna a 320x240 e poi si ingrandisce con i pixel quadrati
       (`image-rendering: pixelated`): i bordi sono scalettati, come allora;
     · le texture non hanno filtro (`NearestFilter`) e sono piccole: nette e
       sgranate, mai sfocate;
     · VERTEX SNAPPING: nello shader la posizione proiettata viene arrotondata
       a una griglia, ed e' questo — non la bassa risoluzione — a dare il
       tremolio dei poligoni tipico di quella macchina;
     · luce sui VERTICI (`MeshLambertMaterial` con `flatShading`), niente
       ombre proiettate;
     · NEBBIA densa: allora serviva a non disegnare il lontano, qui serve alla
       stessa cosa — gira anche su un telefono — e intanto fa quello che
       faceva allora: rende minaccioso un corridoio vuoto.

   Tutto il resto del progetto sta in `docs/16-Atomic-Protocol-Design.md`.

   SU CHE COSA SI APPOGGIA

   Three.js e' gia' in questo repository (`./three.min.js`) perche' lo usano il
   visore molecolare e l'atlante, e il Service Worker lo tiene in cache: niente
   da scaricare, funziona offline. I dati chimici — elementi, domande — sono
   quelli dell'applicazione: nessun secondo elenco di chimica.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  var ID = 'sgioco';
  var NOME = 'ATOMIC PROTOCOL';

  function L() { return globale.BSILingue; }
  function ling() { try { return (L() && L().corrente()) ? L().corrente() : 'it'; } catch (e) { return 'it'; } }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE IMPOSTAZIONI, E DOVE RESTANO

     La visuale e la difficolta' si scelgono nel menu e si RICORDANO: chi
     gioca in prima persona non deve riscegliere ogni volta che apre la
     pagina. Stanno nel deposito locale del browser, una chiave per voce, e
     ogni lettura e' protetta perche' in navigazione privata il deposito puo'
     esistere e rifiutare di scrivere.
     ═════════════════════════════════════════════════════════════════════════ */
  var PRE = 'bsi-ap-';
  var IMP = {
    visuale: 'terza',        /* terza | prima */
    difficolta: 'normale',   /* facile | normale | difficile | esperimento */
    ps1: 'pieno',            /* pieno | ridotto | spento */
    risoluzione: '320',      /* 320 | 480 | 640 */
    suono: 'acceso'
  };

  function leggiImp() {
    Object.keys(IMP).forEach(function (k) {
      try {
        var v = globale.localStorage.getItem(PRE + k);
        if (v) IMP[k] = v;
      } catch (e) { /* senza deposito si gioca con i valori di partenza */ }
    });
  }
  function scriviImp(k, v) {
    IMP[k] = v;
    try { globale.localStorage.setItem(PRE + k, v); } catch (e) {}
  }

  var DIFFICOLTA = {
    facile:      { nome: t('Facile', 'Easy'), vite: 5, danno: 0.6, tempo: 0,
                   sintesiRapida: 99, suggerimento: 'subito' },
    normale:     { nome: t('Normale', 'Normal'), vite: 3, danno: 1, tempo: 0,
                   sintesiRapida: 99, suggerimento: 'dopo' },
    difficile:   { nome: t('Difficile', 'Hard'), vite: 2, danno: 1.4, tempo: 90,
                   sintesiRapida: 2, suggerimento: 'mai' },
    esperimento: { nome: t('Esperimento', 'Experiment'), vite: 1, danno: 2, tempo: 45,
                   sintesiRapida: 0, suggerimento: 'mai' }
  };
  function diff() { return DIFFICOLTA[IMP.difficolta] || DIFFICOLTA.normale; }

  /* ═════════════════════════════════════════════════════════════════════════
     GLI ELEMENTI DEL GIOCO

     Il potere e il perche' sono progetto di gioco; massa, numero atomico,
     gruppo, periodo, elettronegativita', energia di ionizzazione e raggio si
     leggono da `ELEMENTS`, la tavola periodica dell'applicazione. Non si
     riscrivono i dati di 118 elementi dentro un gioco.
     ═════════════════════════════════════════════════════════════════════════ */
  var POTERI = {
    H:  { potere: t('Spinta a idrogeno', 'Hydrogen thrust'),
          descr: t('Il più leggero che esista: un salto più alto, e brucia se trova ossigeno',
                   'The lightest there is: a higher jump, and it burns if it finds oxygen'),
          colore: 0x9fe8ff },
    Cl: { potere: t('Disinfezione', 'Disinfection'),
          descr: t('Ossida e sterilizza: scioglie i residui organici che bloccano i passaggi',
                   'Oxidises and sterilises: dissolves the organic residue blocking passages'),
          colore: 0x9fff5e },
    Na: { potere: t('Reazione violenta', 'Violent reaction'),
          descr: t('Con l’acqua libera idrogeno e calore: fa saltare le valvole bloccate',
                   'With water it releases hydrogen and heat: blows jammed valves'),
          colore: 0xffd93d },
    O:  { potere: t('Ossidazione', 'Oxidation'),
          descr: t('Alimenta la combustione e attacca le catene organiche',
                   'Feeds combustion and attacks organic chains'),
          colore: 0xff6b84 },
    C:  { potere: t('Quattro legami', 'Four bonds'),
          descr: t('Il carbonio tiene insieme quattro cose: costruisce e ripara',
                   'Carbon holds four things together: it builds and repairs'),
          colore: 0x50fa7b },
    Fe: { potere: t('Massa ferrosa', 'Ferrous mass'),
          descr: t('Pesante e magnetico: sfonda e attira quello che è di metallo',
                   'Heavy and magnetic: smashes through and attracts metal'),
          colore: 0xb0bec5 }
  };

  function datiElemento(sim) {
    var base = { sim: sim, nome: sim, Z: null, massa: null, gruppo: null,
                 periodo: null, en: null, ion: null, raggio: null, nota: '' };
    try {
      var el = globale.ELEMENTS;
      if (el && el.length && el[0] && el[0].length > 10) {
        for (var i = 0; i < el.length; i++) if (el[i][1] === sim) {
          return { sim: sim, Z: el[i][0], nome: el[i][2], massa: el[i][3],
                   periodo: el[i][4], gruppo: el[i][5], en: el[i][9],
                   raggio: el[i][10], ion: el[i][11], nota: el[i][13] || '' };
        }
      }
    } catch (e) {}
    return base;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE RICETTE DI SINTESI

     Ogni ricetta e' chimica vera, scritta come la scriverebbe un chimico:
     reagenti, prodotto, equazione bilanciata e a che cosa serve. Si sbloccano
     esplorando, risolvendo enigmi e abbattendo guardiani.
     ═════════════════════════════════════════════════════════════════════════ */
  var RICETTE = [
    { id: 'HCl', nome: t('Acido cloridrico', 'Hydrochloric acid'),
      reagenti: ['H', 'Cl'], formula: 'HCl', classe: t('acido forte', 'strong acid'),
      equazione: 'H₂ + Cl₂ → 2 HCl',
      coeff: [1, 1, 2],
      usa: t('Scioglie gli ossidi e attacca i metalli liberando idrogeno',
             'Dissolves oxides and attacks metals releasing hydrogen'),
      sbloccata: false, dove: t('foglio nello Stoccaggio 1', 'sheet in Storage 1') },
    { id: 'NaOH', nome: t('Idrossido di sodio', 'Sodium hydroxide'),
      reagenti: ['Na', 'O', 'H'], formula: 'NaOH', classe: t('base forte', 'strong base'),
      equazione: '2 Na + 2 H₂O → 2 NaOH + H₂',
      coeff: [2, 2, 2, 1],
      usa: t('Neutralizza gli acidi e saponifica i grassi',
             'Neutralises acids and saponifies fats'),
      sbloccata: false, dove: t('abbattendo POMPA 7', 'by defeating PUMP 7') },
    { id: 'H2O2', nome: t('Perossido di idrogeno', 'Hydrogen peroxide'),
      reagenti: ['H', 'O'], formula: 'H₂O₂', classe: t('ossidante', 'oxidiser'),
      equazione: 'H₂ + O₂ → H₂O₂',
      coeff: [1, 1, 1],
      usa: t('Ossida le catene organiche e le spezza',
             'Oxidises organic chains and breaks them'),
      sbloccata: false, dove: t('enigma del Terminale 1', 'Terminal 1 puzzle') },
    { id: 'NaCl', nome: t('Cloruro di sodio', 'Sodium chloride'),
      reagenti: ['Na', 'Cl'], formula: 'NaCl', classe: t('sale', 'salt'),
      equazione: '2 Na + Cl₂ → 2 NaCl',
      coeff: [2, 1, 2],
      usa: t('Innocuo e stabile: serve come tampone e come zavorra',
             'Harmless and stable: works as a buffer and as ballast'),
      sbloccata: true, dove: t('la sai già', 'you already know it') }
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     LO STATO
     ═════════════════════════════════════════════════════════════════════════ */
  var S = null;
  var schermo = 'titolo';     /* titolo · impostazioni · codex · gioco · pausa
                                 · inventario · sintesi · enigma · esito */
  var T = null;               /* THREE */
  var ren = null, scena = null, camera = null, tela = null;
  var pronto = false, errore3d = null;
  var anim = null, ultimo = 0, accumulo = 0;
  var PASSO = 1000 / 60;
  var tasti = {};
  var mondo = null;           /* la zona costruita */
  var chimico = null;         /* il rig del personaggio */
  var mani = null;            /* le mani, in prima persona */
  var audio = null;

  function nuovaPartita() {
    var d = diff();
    S = {
      zona: 1, vite: d.vite, vitaMax: d.vite,
      pos: { x: 0, y: 0, z: 0 }, ang: 0, angY: 0,
      vel: { x: 0, y: 0, z: 0 }, terra: true,
      inventario: [],          /* { sim, padronanza, usi } */
      composti: [],            /* { id, dosi } */
      ricette: RICETTE.map(function (r) {
        return { id: r.id, sbloccata: r.sbloccata };
      }),
      codex: { elementi: [], molecole: [], reazioni: [], consigli: [] },
      fatti: {},               /* quello che è già successo: porte, enigmi… */
      punti: 0, passi: 0,
      boss: null, finito: null
    };
    return S;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL SUONO — sintetizzato, perché un file audio offline non c'è
     ═════════════════════════════════════════════════════════════════════════ */
  function bip(freq, durata, tipo, vol) {
    if (IMP.suono !== 'acceso') return;
    try {
      if (!audio) audio = new (globale.AudioContext || globale.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = tipo || 'square';
      o.frequency.value = freq;
      g.gain.value = vol == null ? 0.05 : vol;
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (durata || 0.08));
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + (durata || 0.08));
    } catch (e) {}
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL MOTORE PS1
     ═════════════════════════════════════════════════════════════════════════ */
  function caricaThree(cb) {
    if (globale.THREE) { T = globale.THREE; cb(true); return; }
    var vecchio = document.querySelector('script[data-bsi-three]');
    if (vecchio) {
      vecchio.addEventListener('load', function () { T = globale.THREE; cb(!!T); });
      vecchio.addEventListener('error', function () { cb(false); });
      return;
    }
    var s = document.createElement('script');
    s.src = './three.min.js';
    s.setAttribute('data-bsi-three', '1');
    s.onload = function () { T = globale.THREE; cb(!!T); };
    s.onerror = function () { errore3d = 'three.min.js non si carica'; cb(false); };
    document.head.appendChild(s);
  }

  /* IL TREMOLIO DEI VERTICI.
     Sulla PlayStation 1 le coordinate dei vertici erano numeri interi: ogni
     vertice veniva «agganciato» alla griglia dello schermo, e quando la
     telecamera si muoveva i poligoni tremavano. E' il segno piu' riconoscibile
     di quella macchina, e non si ottiene abbassando la risoluzione: si ottiene
     arrotondando la posizione DOPO la proiezione. Qui si innesta una riga nel
     vertex shader dei materiali normali di Three, cosi' il resto (luci,
     nebbia, texture) continua a funzionare come sempre. */
  function ps1(materiale, forza) {
    materiale.onBeforeCompile = function (shader) {
      shader.uniforms.bsiGriglia = { value: forza || 1 };
      shader.vertexShader = 'uniform float bsiGriglia;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        [
          '#include <project_vertex>',
          'if (bsiGriglia > 0.0) {',
          '  float g = 160.0 / bsiGriglia;',
          '  vec2 pix = gl_Position.xy / gl_Position.w;',
          '  pix = floor(pix * g + 0.5) / g;',
          '  gl_Position.xy = pix * gl_Position.w;',
          '}'
        ].join('\n'));
      materiale.userData.shader = shader;
    };
    materiale.needsUpdate = true;
    return materiale;
  }

  var MAT = {};

  function tessitura(dis, dim) {
    var c = document.createElement('canvas');
    c.width = c.height = dim || 32;
    var q = c.getContext('2d');
    dis(q, c.width);
    var tex = new T.CanvasTexture(c);
    /* NIENTE FILTRO: è questo che rende le texture nette e sgranate */
    tex.magFilter = T.NearestFilter;
    tex.minFilter = T.NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    return tex;
  }

  function materiali() {
    var forza = IMP.ps1 === 'pieno' ? 1 : (IMP.ps1 === 'ridotto' ? 2.6 : 0);

    var tPavimento = tessitura(function (q, n) {
      q.fillStyle = '#2a3340'; q.fillRect(0, 0, n, n);
      q.fillStyle = '#323d4c';
      for (var i = 0; i < n; i += 8) for (var j = 0; j < n; j += 8)
        if ((i + j) % 16 === 0) q.fillRect(i, j, 8, 8);
      q.fillStyle = '#1d242e';
      q.fillRect(0, 0, n, 1); q.fillRect(0, 0, 1, n);
    }, 32);
    tPavimento.repeat.set(4, 4);

    var tMuro = tessitura(function (q, n) {
      q.fillStyle = '#3a4455'; q.fillRect(0, 0, n, n);
      q.fillStyle = '#46516380';
      q.fillRect(2, 2, n - 4, n / 2 - 4);
      q.fillStyle = '#272f3c';
      q.fillRect(0, n / 2, n, 2);
      q.fillStyle = '#5a6880';
      q.fillRect(n - 6, 6, 3, 3);
    }, 32);
    tMuro.repeat.set(3, 1);

    var tMetallo = tessitura(function (q, n) {
      q.fillStyle = '#5c6472'; q.fillRect(0, 0, n, n);
      for (var i = 0; i < n; i += 4) {
        q.fillStyle = (i % 8 === 0) ? '#6b7486' : '#4e5663';
        q.fillRect(0, i, n, 2);
      }
    }, 32);

    MAT.pavimento = ps1(new T.MeshLambertMaterial({ map: tPavimento }), forza);
    MAT.muro = ps1(new T.MeshLambertMaterial({ map: tMuro }), forza);
    MAT.soffitto = ps1(new T.MeshLambertMaterial({ color: 0x1d242e }), forza);
    MAT.metallo = ps1(new T.MeshLambertMaterial({ map: tMetallo }), forza);
    MAT.bidone = ps1(new T.MeshLambertMaterial({ color: 0x3f6f4a, flatShading: true }), forza);
    MAT.bidoneTop = ps1(new T.MeshLambertMaterial({ color: 0x8aa14b, flatShading: true }), forza);
    MAT.scaffale = ps1(new T.MeshLambertMaterial({ color: 0x4a5160, flatShading: true }), forza);
    MAT.porta = ps1(new T.MeshLambertMaterial({ color: 0x6b4a2a, flatShading: true }), forza);
    MAT.portaChiusa = ps1(new T.MeshLambertMaterial({ color: 0x7a3030, flatShading: true }), forza);
    MAT.luce = new T.MeshBasicMaterial({ color: 0xfff6d8 });
    MAT.luceRossa = new T.MeshBasicMaterial({ color: 0xff4d4d });
    MAT.camice = ps1(new T.MeshLambertMaterial({ color: 0xe8edf3, flatShading: true }), forza);
    MAT.pelle = ps1(new T.MeshLambertMaterial({ color: 0xe0b183, flatShading: true }), forza);
    MAT.pantaloni = ps1(new T.MeshLambertMaterial({ color: 0x33415c, flatShading: true }), forza);
    MAT.scarpe = ps1(new T.MeshLambertMaterial({ color: 0x5a3b2a, flatShading: true }), forza);
    MAT.capelli = ps1(new T.MeshLambertMaterial({ color: 0x3a2b22, flatShading: true }), forza);
    MAT.vetro = ps1(new T.MeshLambertMaterial({ color: 0x9fd8ff, flatShading: true }), forza);
    MAT.nemico = ps1(new T.MeshLambertMaterial({ color: 0x7ab648, flatShading: true }), forza);
    MAT.boss = ps1(new T.MeshLambertMaterial({ color: 0x8a4a3a, flatShading: true }), forza);
    MAT.bossMetallo = ps1(new T.MeshLambertMaterial({ color: 0x8e99a8, flatShading: true }), forza);
    MAT.terminale = ps1(new T.MeshLambertMaterial({ color: 0x28323f, flatShading: true }), forza);
    MAT.schermo = new T.MeshBasicMaterial({ color: 0x4fe3a0 });
    MAT.banco = ps1(new T.MeshLambertMaterial({ color: 0x4e5b6b, flatShading: true }), forza);
  }

  /* ── il chimico, low-poly e articolato ─────────────────────────────────
     Duecento triangoli scarsi, come allora: testa squadrata, mani senza dita,
     e gli snodi dove servono — spalle, gomiti, anche, ginocchia — perche' un
     personaggio che cammina senza piegare le gambe e' un pupazzo che scivola. */
  function box(l, a, p, mat, x, y, z) {
    var m = new T.Mesh(new T.BoxGeometry(l, a, p), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  function costruisciChimico() {
    var g = new T.Group();
    var bacino = new T.Group();
    bacino.position.y = 0.92;
    g.add(bacino);

    var busto = new T.Group();
    bacino.add(busto);
    busto.add(box(0.46, 0.5, 0.26, MAT.camice, 0, 0.25, 0));
    /* il distintivo: prende il colore dell'elemento in uso */
    var distintivo = box(0.12, 0.12, 0.03, new T.MeshBasicMaterial({ color: 0x4fe3a0 }),
                         0.12, 0.3, 0.14);
    busto.add(distintivo);

    var collo = new T.Group();
    collo.position.y = 0.52;
    busto.add(collo);
    collo.add(box(0.28, 0.3, 0.26, MAT.pelle, 0, 0.15, 0));
    collo.add(box(0.3, 0.1, 0.28, MAT.capelli, 0, 0.3, 0));
    collo.add(box(0.26, 0.06, 0.04, MAT.vetro, 0, 0.16, 0.14));

    function braccio(lato) {
      var spalla = new T.Group();
      spalla.position.set(lato * 0.3, 0.44, 0);
      busto.add(spalla);
      spalla.add(box(0.13, 0.3, 0.13, MAT.camice, 0, -0.15, 0));
      var gomito = new T.Group();
      gomito.position.y = -0.3;
      spalla.add(gomito);
      gomito.add(box(0.12, 0.28, 0.12, MAT.pelle, 0, -0.14, 0));
      return { spalla: spalla, gomito: gomito };
    }
    function gamba(lato) {
      var anca = new T.Group();
      anca.position.set(lato * 0.13, 0, 0);
      bacino.add(anca);
      anca.add(box(0.17, 0.42, 0.17, MAT.pantaloni, 0, -0.21, 0));
      var ginocchio = new T.Group();
      ginocchio.position.y = -0.42;
      anca.add(ginocchio);
      ginocchio.add(box(0.16, 0.4, 0.16, MAT.pantaloni, 0, -0.2, 0));
      ginocchio.add(box(0.18, 0.12, 0.3, MAT.scarpe, 0, -0.44, 0.05));
      return { anca: anca, ginocchio: ginocchio };
    }

    return {
      nodo: g, bacino: bacino, busto: busto, collo: collo, distintivo: distintivo,
      bSx: braccio(-1), bDx: braccio(1), gSx: gamba(-1), gDx: gamba(1)
    };
  }

  function animaChimico(dt) {
    if (!chimico) return;
    var v = Math.hypot(S.vel.x, S.vel.z);
    var r = chimico;
    S.passi += v;
    var f = S.passi * 2.4;
    if (!S.terra) {
      r.gSx.anca.rotation.x = -0.5; r.gDx.anca.rotation.x = 0.4;
      r.gSx.ginocchio.rotation.x = -0.6; r.gDx.ginocchio.rotation.x = -0.3;
      r.bSx.spalla.rotation.x = -1.6; r.bDx.spalla.rotation.x = -1.4;
      r.bacino.position.y = 0.92;
      return;
    }
    if (v < 0.004) {
      /* fermo: respira. Un personaggio immobile sembra un oggetto */
      var re = Math.sin(S.passi * 0 + Date.now() / 700) * 0.012;
      r.gSx.anca.rotation.x = 0; r.gDx.anca.rotation.x = 0;
      r.gSx.ginocchio.rotation.x = -0.05; r.gDx.ginocchio.rotation.x = -0.05;
      r.bSx.spalla.rotation.x = 0.05; r.bDx.spalla.rotation.x = 0.05;
      r.bSx.gomito.rotation.x = -0.25; r.bDx.gomito.rotation.x = -0.25;
      r.bacino.position.y = 0.92 + re;
      r.busto.rotation.x = 0.02;
      return;
    }
    var sin = Math.sin(f), cos = Math.cos(f);
    var amp = Math.min(1, v * 110);
    r.gSx.anca.rotation.x = sin * 0.85 * amp;
    r.gDx.anca.rotation.x = -sin * 0.85 * amp;
    r.gSx.ginocchio.rotation.x = -Math.max(0, cos) * 1.0 * amp - 0.08;
    r.gDx.ginocchio.rotation.x = -Math.max(0, -cos) * 1.0 * amp - 0.08;
    r.bSx.spalla.rotation.x = -sin * 0.7 * amp;
    r.bDx.spalla.rotation.x = sin * 0.7 * amp;
    r.bSx.gomito.rotation.x = -0.45 - Math.max(0, sin) * 0.4;
    r.bDx.gomito.rotation.x = -0.45 - Math.max(0, -sin) * 0.4;
    r.bacino.position.y = 0.92 + Math.abs(sin) * 0.05 * amp;
    r.busto.rotation.x = 0.1 * amp;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LA ZONA 1 — «ALA OVEST · STOCCAGGIO REAGENTI»

     Sei ambienti, descritti come DATI e non come codice: ogni stanza è un
     rettangolo con le sue porte, i suoi oggetti e i suoi incontri. Costruire
     il mondo da una descrizione invece che a mano serve a una cosa sola, ma
     importante: il banco può leggerla e verificare che da ogni stanza si
     arrivi al guardiano — una porta dimenticata è un gioco interrotto, e non
     si vede guardando il codice.
     ═════════════════════════════════════════════════════════════════════════ */
  function ZONA1() {
    return {
      nome: t('ALA OVEST · STOCCAGGIO REAGENTI', 'WEST WING · REAGENT STORAGE'),
      nebbia: 0x121820, luce: 0x8fa0b8,
      stanze: [
        { id: 'stoc1', nome: t('Stoccaggio 1', 'Storage 1'),
          x: 0, z: 0, larg: 12, prof: 14, alt: 3.4,
          porte: [{ verso: 'nord', a: 'corrA' }, { verso: 'ovest', a: 'banco' }],
          oggetti: [
            { tipo: 'elemento', sim: 'H', x: -3.5, z: -4 },
            { tipo: 'foglio', id: 'ricettaHCl', x: 3.6, z: -3.2,
              testo: t('Foglio stropicciato: «H + Cl → HCl. Scioglie gli ossidi. ' +
                       'Non respirarlo.»',
                       'Crumpled sheet: «H + Cl → HCl. Dissolves oxides. Do not breathe it.»') },
            { tipo: 'scaffale', x: -5, z: 2 }, { tipo: 'scaffale', x: -5, z: 4 },
            { tipo: 'bidone', x: 4.5, z: 4 }, { tipo: 'bidone', x: 3.4, z: 5 },
            { tipo: 'bidone', x: 4.8, z: 1.5 }
          ] },
        { id: 'corrA', nome: t('Corridoio A', 'Corridor A'),
          x: 0, z: -16, larg: 5, prof: 18, alt: 3,
          porte: [{ verso: 'sud', a: 'stoc1' }, { verso: 'nord', a: 'archivio' },
                  { verso: 'est', a: 'stoc2' }],
          oggetti: [
            { tipo: 'nemico', x: -1, z: -2 }, { tipo: 'nemico', x: 1.2, z: -7 },
            { tipo: 'bidone', x: -1.6, z: 3 }
          ] },
        { id: 'archivio', nome: t('Archivio', 'Archive'),
          x: 0, z: -30, larg: 10, prof: 8, alt: 3.2,
          porte: [{ verso: 'sud', a: 'corrA' }],
          oggetti: [
            { tipo: 'elemento', sim: 'Na', x: 3, z: -2 },
            { tipo: 'foglio', id: 'notaCustode', x: -3, z: -2,
              testo: t('Verbale del Custode, 03:00: «Protocollo 12 ripreso su ' +
                       'istruzione archiviata. Contenimento preventivo attivo.» ' +
                       'L’istruzione, in fondo, è scritta a mano: riprendere comunque.',
                       'Custodian log, 03:00: «Protocol 12 resumed on archived ' +
                       'instruction. Preventive containment active.» The instruction, ' +
                       'at the bottom, is handwritten: resume regardless.') },
            { tipo: 'scaffale', x: -4, z: 1 }, { tipo: 'scaffale', x: 4, z: 1 }
          ] },
        { id: 'banco', nome: t('Banco di sintesi', 'Synthesis bench'),
          x: -16, z: 0, larg: 9, prof: 9, alt: 3.2,
          porte: [{ verso: 'est', a: 'stoc1' }],
          oggetti: [
            { tipo: 'banco', x: 0, z: -2.6 },
            { tipo: 'scaffale', x: -3.4, z: 2 }, { tipo: 'bidone', x: 3, z: 2.4 }
          ] },
        { id: 'stoc2', nome: t('Stoccaggio 2', 'Storage 2'),
          x: 14, z: -16, larg: 11, prof: 10, alt: 3.4,
          porte: [{ verso: 'ovest', a: 'corrA' }, { verso: 'sud', a: 'term' }],
          oggetti: [
            { tipo: 'elemento', sim: 'Cl', x: 3.6, z: -2.6 },
            { tipo: 'nemico', x: -2, z: 2 },
            { tipo: 'scaffale', x: -4.2, z: -2 }, { tipo: 'bidone', x: 4.4, z: 3 },
            { tipo: 'bidone', x: 3.2, z: 3.8 }
          ] },
        { id: 'term', nome: t('Terminale 1', 'Terminal 1'),
          x: 14, z: -4, larg: 8, prof: 8, alt: 3,
          porte: [{ verso: 'nord', a: 'stoc2' },
                  { verso: 'sud', a: 'pompe', chiusa: 'paratia1' }],
          oggetti: [
            { tipo: 'terminale', id: 'term1', x: 0, z: -2.8 },
            { tipo: 'bidone', x: -3, z: 2 }
          ] },
        { id: 'pompe', nome: t('Sala pompe', 'Pump room'),
          x: 14, z: 10, larg: 16, prof: 16, alt: 4.2,
          porte: [{ verso: 'nord', a: 'term' }],
          oggetti: [
            { tipo: 'boss', id: 'pompa7', x: 0, z: -4 },
            { tipo: 'scaffale', x: -6, z: 5 }, { tipo: 'scaffale', x: 6, z: 5 }
          ] }
      ],
      partenza: { stanza: 'stoc1', x: 0, z: 5 }
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     COSTRUIRE IL MONDO

     Ogni stanza diventa pavimento, soffitto, quattro muri con i vani delle
     porte, e gli oggetti. I muri si costruiscono a PEZZI attorno al vano:
     una porta è un buco in un muro, non una porta appoggiata sopra.
     ═════════════════════════════════════════════════════════════════════════ */
  function muroConVano(l, a, mat, vani) {
    /* restituisce un gruppo largo `l` alto `a` con dei buchi larghi 2 ai
       centri indicati in `vani` */
    var g = new T.Group();
    var punti = [-l / 2];
    vani.forEach(function (c) { punti.push(c - 1.1, c + 1.1); });
    punti.push(l / 2);
    for (var i = 0; i < punti.length; i += 2) {
      var a1 = punti[i], a2 = punti[i + 1];
      if (a2 - a1 < 0.05) continue;
      var m = new T.Mesh(new T.BoxGeometry(a2 - a1, a, 0.3), mat);
      m.position.set((a1 + a2) / 2, a / 2, 0);
      g.add(m);
    }
    /* l'architrave sopra ogni vano */
    vani.forEach(function (c) {
      var ar = new T.Mesh(new T.BoxGeometry(2.2, a - 2.4, 0.3), mat);
      ar.position.set(c, a - (a - 2.4) / 2, 0);
      g.add(ar);
    });
    return g;
  }

  function costruisciStanza(st, zona) {
    var g = new T.Group();
    g.position.set(st.x, 0, st.z);
    var L2 = st.larg / 2, P2 = st.prof / 2;

    var pav = new T.Mesh(new T.BoxGeometry(st.larg, 0.3, st.prof), MAT.pavimento);
    pav.position.y = -0.15;
    g.add(pav);
    var sof = new T.Mesh(new T.BoxGeometry(st.larg, 0.3, st.prof), MAT.soffitto);
    sof.position.y = st.alt;
    g.add(sof);

    function vaniPer(verso) {
      return (st.porte || []).filter(function (p) { return p.verso === verso; })
        .map(function () { return 0; });
    }
    var nord = muroConVano(st.larg, st.alt, MAT.muro, vaniPer('nord'));
    nord.position.set(0, 0, -P2); g.add(nord);
    var sud = muroConVano(st.larg, st.alt, MAT.muro, vaniPer('sud'));
    sud.position.set(0, 0, P2); g.add(sud);
    var est = muroConVano(st.prof, st.alt, MAT.muro, vaniPer('est'));
    est.rotation.y = Math.PI / 2; est.position.set(L2, 0, 0); g.add(est);
    var ovest = muroConVano(st.prof, st.alt, MAT.muro, vaniPer('ovest'));
    ovest.rotation.y = Math.PI / 2; ovest.position.set(-L2, 0, 0); g.add(ovest);

    /* la luce al soffitto: un pannello acceso, e una rossa di emergenza */
    for (var lz = -P2 + 3; lz < P2; lz += 6) {
      var pl = new T.Mesh(new T.BoxGeometry(1.6, 0.1, 0.5), MAT.luce);
      pl.position.set(0, st.alt - 0.25, lz);
      g.add(pl);
    }
    var em = new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.3), MAT.luceRossa);
    em.position.set(L2 - 0.4, st.alt - 0.7, -P2 + 0.6);
    g.add(em);
    st._emergenza = em;

    return g;
  }

  function costruisciOggetto(o, st) {
    var g = new T.Group();
    g.position.set(st.x + o.x, 0, st.z + o.z);
    o._nodo = g;
    o._stanza = st.id;
    if (o.tipo === 'scaffale') {
      var m = new T.Mesh(new T.BoxGeometry(1.6, 2.2, 0.7), MAT.scaffale);
      m.position.y = 1.1; g.add(m);
      for (var r = 0; r < 3; r++) {
        var b = new T.Mesh(new T.BoxGeometry(1.4, 0.1, 0.6), MAT.metallo);
        b.position.set(0, 0.5 + r * 0.6, 0); g.add(b);
      }
      o._solido = { l: 1.6, p: 0.7 };
    } else if (o.tipo === 'bidone') {
      var c = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 1.1, 8), MAT.bidone);
      c.position.y = 0.55; g.add(c);
      var tp = new T.Mesh(new T.CylinderGeometry(0.44, 0.44, 0.12, 8), MAT.bidoneTop);
      tp.position.y = 1.15; g.add(tp);
      o._solido = { l: 0.9, p: 0.9 };
    } else if (o.tipo === 'banco') {
      var p1 = new T.Mesh(new T.BoxGeometry(3.2, 0.9, 1.1), MAT.banco);
      p1.position.y = 0.45; g.add(p1);
      var v = new T.Mesh(new T.BoxGeometry(2.6, 0.9, 0.08), MAT.schermo);
      v.position.set(0, 1.4, -0.4); g.add(v);
      for (var k = -1; k <= 1; k += 2) {
        var bo = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.5, 6), MAT.vetro);
        bo.position.set(k * 0.9, 1.15, 0.2); g.add(bo);
      }
      o._solido = { l: 3.2, p: 1.1 };
    } else if (o.tipo === 'terminale') {
      var t1 = new T.Mesh(new T.BoxGeometry(1.4, 1.9, 0.8), MAT.terminale);
      t1.position.y = 0.95; g.add(t1);
      var sc = new T.Mesh(new T.BoxGeometry(1.1, 0.8, 0.06), MAT.schermo);
      sc.position.set(0, 1.45, 0.42); g.add(sc);
      o._schermo = sc;
      o._solido = { l: 1.4, p: 0.8 };
    } else if (o.tipo === 'elemento') {
      var d = datiElemento(o.sim);
      var col = (POTERI[o.sim] && POTERI[o.sim].colore) || 0x5eead4;
      var sf = new T.Mesh(new T.IcosahedronGeometry(0.3, 0),
                          new T.MeshLambertMaterial({ color: col, flatShading: true }));
      sf.position.y = 0.9; g.add(sf);
      var alone = new T.Mesh(new T.IcosahedronGeometry(0.45, 0),
                             new T.MeshBasicMaterial({ color: col, wireframe: true }));
      alone.position.y = 0.9; g.add(alone);
      o._gira = sf; o._alone = alone; o._dati = d;
    } else if (o.tipo === 'foglio') {
      var fg = new T.Mesh(new T.BoxGeometry(0.4, 0.02, 0.55),
                          new T.MeshBasicMaterial({ color: 0xe8e2cf }));
      fg.position.y = 0.05; fg.rotation.y = 0.5; g.add(fg);
      o._gira = fg;
    } else if (o.tipo === 'nemico') {
      var corpo = new T.Mesh(new T.IcosahedronGeometry(0.5, 0), MAT.nemico);
      corpo.position.y = 0.6; corpo.scale.set(1, 1.2, 1); g.add(corpo);
      o._corpo = corpo; o.vivo = true; o.t = Math.random() * 100;
      o._base = { x: st.x + o.x, z: st.z + o.z };
    } else if (o.tipo === 'boss') {
      /* POMPA 7, a blocchi: corpo, flangia, girante, due tubi di mandata e
         il volantino della valvola. Trecento triangoli scarsi — quello che
         una macchina del 1996 poteva permettersi per un nemico grande. */
      var bg = new T.Group();
      var cassa = new T.Mesh(new T.BoxGeometry(2.6, 2.2, 2.0), MAT.bossMetallo);
      cassa.position.y = 1.5; bg.add(cassa);
      var ruggine = new T.Mesh(new T.BoxGeometry(2.72, 2.32, 2.12), MAT.boss);
      ruggine.position.y = 1.5; bg.add(ruggine);
      /* la girante: un cilindro largo e basso, con il mozzo */
      var gir = new T.Mesh(new T.CylinderGeometry(1.15, 1.15, 0.55, 10), MAT.metallo);
      gir.rotation.x = Math.PI / 2; gir.position.set(0, 1.5, 1.05); bg.add(gir);
      var moz = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.8, 8), MAT.bossMetallo);
      moz.rotation.x = Math.PI / 2; moz.position.set(0, 1.5, 1.25); bg.add(moz);
      /* i tubi di mandata, uno per lato, e il collettore sopra */
      [-1, 1].forEach(function (l) {
        var tb = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 1.6, 8), MAT.metallo);
        tb.rotation.z = Math.PI / 2; tb.position.set(l * 1.9, 1.1, 0); bg.add(tb);
        var fl = new T.Mesh(new T.CylinderGeometry(0.46, 0.46, 0.18, 8), MAT.bossMetallo);
        fl.rotation.z = Math.PI / 2; fl.position.set(l * 2.6, 1.1, 0); bg.add(fl);
      });
      var coll = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 3.0, 8), MAT.metallo);
      coll.rotation.z = Math.PI / 2; coll.position.y = 3.0; bg.add(coll);
      /* il volantino della valvola: gira quando la pompa è attiva */
      var vol = new T.Mesh(new T.TorusGeometry(0.5, 0.11, 6, 10), MAT.bossMetallo);
      vol.position.set(0, 3.0, 0.6); bg.add(vol);
      var oA = new T.Mesh(new T.BoxGeometry(0.42, 0.42, 0.1),
                          new T.MeshBasicMaterial({ color: 0xff4d4d }));
      var oB = oA.clone();
      oA.position.set(-0.62, 2.25, 1.08); oB.position.set(0.62, 2.25, 1.08);
      bg.add(oA); bg.add(oB);
      g.add(bg);
      o._corpo = bg; o._ruggine = ruggine; o._occhi = [oA, oB];
      o._girante = gir; o._volantino = vol;
      o._solido = { l: 2.6, p: 2.0 };
    }
    return g;
  }

  function costruisciMondo() {
    var zona = ZONA1();
    var radice = new T.Group();
    zona.stanze.forEach(function (st) {
      radice.add(costruisciStanza(st, zona));
      (st.oggetti || []).forEach(function (o) {
        radice.add(costruisciOggetto(o, st));
      });
    });
    scena.add(radice);
    scena.fog = new T.Fog(zona.nebbia, 6, 30);
    scena.background = new T.Color(zona.nebbia);
    return { zona: zona, radice: radice };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     DOVE SI PUO' STARE

     Le collisioni sono a scatole allineate agli assi, e si risolvono per
     assi separati: prima la x, poi la z. E' il modo piu' semplice che non
     incastra: muovendo un asse per volta, chi striscia lungo un muro
     continua a scorrere invece di fermarsi.
     ═════════════════════════════════════════════════════════════════════════ */
  function stanzaDi(x, z) {
    var zz = mondo.zona.stanze;
    for (var i = 0; i < zz.length; i++) {
      var st = zz[i];
      if (x > st.x - st.larg / 2 && x < st.x + st.larg / 2 &&
          z > st.z - st.prof / 2 && z < st.z + st.prof / 2) return st;
    }
    return null;
  }

  /* un vano di porta è aperto se la porta non è chiusa a chiave */
  function portaAperta(st, verso) {
    var p = (st.porte || []).filter(function (q) { return q.verso === verso; })[0];
    if (!p) return false;
    if (!p.chiusa) return true;
    return !!(S.fatti && S.fatti[p.chiusa]);
  }

  function liberoIn(x, z) {
    var st = stanzaDi(x, z);
    if (!st) return false;
    var r = 0.35;
    var L2 = st.larg / 2 - 0.3, P2 = st.prof / 2 - 0.3;
    var dx = x - st.x, dz = z - st.z;
    /* dentro i muri, a meno che non si sia dentro un vano di porta aperto */
    if (dz < -P2 + r && !(Math.abs(dx) < 0.9 && portaAperta(st, 'nord'))) return false;
    if (dz > P2 - r && !(Math.abs(dx) < 0.9 && portaAperta(st, 'sud'))) return false;
    if (dx < -L2 + r && !(Math.abs(dz) < 0.9 && portaAperta(st, 'ovest'))) return false;
    if (dx > L2 - r && !(Math.abs(dz) < 0.9 && portaAperta(st, 'est'))) return false;
    /* gli oggetti solidi */
    var ok = true;
    (st.oggetti || []).forEach(function (o) {
      if (!o._solido || o.preso || o.abbattuto) return;
      var ox = st.x + o.x, oz = st.z + o.z;
      if (Math.abs(x - ox) < o._solido.l / 2 + r &&
          Math.abs(z - oz) < o._solido.p / 2 + r) ok = false;
    });
    return ok;
  }

  /* fra due stanze c'è un pezzo di corridoio: lo spazio del vano. Qui si
     consente il passaggio anche se nessuna delle due stanze lo contiene */
  function neiVani(x, z) {
    var zz = mondo.zona.stanze;
    for (var i = 0; i < zz.length; i++) {
      var st = zz[i];
      var L2 = st.larg / 2, P2 = st.prof / 2;
      var dx = x - st.x, dz = z - st.z;
      if (Math.abs(dx) < 0.9 && dz < -P2 && dz > -P2 - 1.2 && portaAperta(st, 'nord')) return true;
      if (Math.abs(dx) < 0.9 && dz > P2 && dz < P2 + 1.2 && portaAperta(st, 'sud')) return true;
      if (Math.abs(dz) < 0.9 && dx < -L2 && dx > -L2 - 1.2 && portaAperta(st, 'ovest')) return true;
      if (Math.abs(dz) < 0.9 && dx > L2 && dx < L2 + 1.2 && portaAperta(st, 'est')) return true;
    }
    return false;
  }

  function puoStare(x, z) { return liberoIn(x, z) || neiVani(x, z); }

  /* ═════════════════════════════════════════════════════════════════════════
     IL PASSO DI GIOCO
     ═════════════════════════════════════════════════════════════════════════ */
  var VEL = 0.052, VEL_CORSA = 0.092, GIRO = 0.035;

  function passo() {
    if (!S || schermo !== 'gioco' || !mondo) return;
    var corre = !!tasti.corsa;
    var v = corre ? VEL_CORSA : VEL;

    /* ── ci si gira ─────────────────────────────────────────────────────
       In terza persona le frecce laterali girano il personaggio (come nei
       giochi dell'epoca: «comandi a carro armato», ma addolciti); in prima
       persona girano lo sguardo. */
    if (tasti.sx) S.ang += GIRO;
    if (tasti.dx) S.ang -= GIRO;
    if (tasti.guardaSu) S.angY = Math.min(0.6, S.angY + 0.02);
    if (tasti.guardaGiu) S.angY = Math.max(-0.6, S.angY - 0.02);

    var avanti = (tasti.su ? 1 : 0) - (tasti.giu ? 1 : 0);
    var lat = (tasti.latSx ? 1 : 0) - (tasti.latDx ? 1 : 0);
    var dx = (-Math.sin(S.ang) * avanti - Math.cos(S.ang) * lat) * v;
    var dz = (-Math.cos(S.ang) * avanti + Math.sin(S.ang) * lat) * v;

    /* un asse per volta: così si scivola lungo i muri invece di incastrarsi */
    if (dx && puoStare(S.pos.x + dx, S.pos.z)) S.pos.x += dx;
    if (dz && puoStare(S.pos.x, S.pos.z + dz)) S.pos.z += dz;
    S.vel.x = dx; S.vel.z = dz;

    /* ── il salto ─────────────────────────────────────────────────────── */
    if (tasti.salto && S.terra) { S.vel.y = 0.19; S.terra = false; bip(380, 0.06); }
    if (!S.terra) {
      S.vel.y -= 0.011;
      S.pos.y += S.vel.y;
      if (S.pos.y <= 0) { S.pos.y = 0; S.vel.y = 0; S.terra = true; }
    }

    /* ── gli oggetti vivi ─────────────────────────────────────────────── */
    var st = stanzaDi(S.pos.x, S.pos.z);
    mondo.zona.stanze.forEach(function (sx) {
      (sx.oggetti || []).forEach(function (o) {
        if (o.tipo === 'elemento' && !o.preso) {
          o._gira.rotation.y += 0.03;
          o._alone.rotation.y -= 0.02;
          o._gira.position.y = 0.9 + Math.sin(Date.now() / 420) * 0.08;
          o._alone.position.y = o._gira.position.y;
        } else if (o.tipo === 'foglio' && !o.preso) {
          o._gira.rotation.y += 0.01;
        } else if (o.tipo === 'nemico' && o.vivo) {
          o.t++;
          var d = Math.hypot(S.pos.x - (sx.x + o.x), S.pos.z - (sx.z + o.z));
          if (d < 7 && sx === st) {
            /* ti viene incontro, piano: è un residuo, non un atleta */
            var ax = (S.pos.x - (sx.x + o.x)) / d, az = (S.pos.z - (sx.z + o.z)) / d;
            o.x += ax * 0.014; o.z += az * 0.014;
            o._nodo.position.set(sx.x + o.x, 0, sx.z + o.z);
          }
          o._corpo.position.y = 0.6 + Math.abs(Math.sin(o.t / 22)) * 0.12;
          o._corpo.rotation.y += 0.01;
          if (d < 0.9 && !S.immune) danno(t('un residuo corrosivo ti ha toccato',
                                            'a corrosive residue touched you'));
        } else if (o.tipo === 'boss' && !o.abbattuto) {
          passoBoss(o, sx);
        }
      });
    });
    if (S.immune > 0) S.immune--;
    S.t = (S.t || 0) + 1;
  }

  function danno(perche) {
    if (S.immune > 0) return;
    S.immune = 60;
    S.vite -= 1;
    bip(140, 0.25, 'sawtooth', 0.08);
    avviso(perche);
    if (S.vite <= 0) {
      S.finito = { esito: 'perso', perche: perche };
      schermo = 'esito';
      disegnaUI();
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LA TELECAMERA — terza o prima persona, e si cambia subito
     ═════════════════════════════════════════════════════════════════════════ */
  function muoviCamera() {
    if (!camera || !S) return;
    var prima = IMP.visuale === 'prima';
    chimico.nodo.position.set(S.pos.x, S.pos.y, S.pos.z);
    chimico.nodo.rotation.y = S.ang;
    /* IN PRIMA PERSONA IL CORPO NON SI DISEGNA. Vedersi il proprio busto da
       dentro la testa è il modo più rapido di rompere l'illusione. */
    chimico.nodo.visible = !prima;
    if (prima) {
      camera.position.set(S.pos.x, S.pos.y + 1.52, S.pos.z);
      camera.rotation.set(S.angY, S.ang, 0, 'YXZ');
      /* LE MANI SI VEDONO. Una prima persona senza mani è una telecamera che
         vola: due guanti in basso, che ondeggiano quando si cammina, bastano
         a dire «questo corpo è tuo». */
      if (!mani) {
        mani = new T.Group();
        [-1, 1].forEach(function (l) {
          /* piccole e in basso: una mano grande come un cofano dice solo che
             sei dentro un guanto, non che stai camminando */
          var m = new T.Mesh(new T.BoxGeometry(0.1, 0.09, 0.2), MAT.pelle);
          m.position.set(l * 0.22, -0.26, -0.62);
          mani.add(m);
          var p = new T.Mesh(new T.BoxGeometry(0.11, 0.1, 0.12), MAT.camice);
          p.position.set(l * 0.22, -0.265, -0.48);
          mani.add(p);
        });
        camera.add(mani);
        scena.add(camera);
      }
      mani.visible = true;
      var v2 = Math.hypot(S.vel.x, S.vel.z);
      var osc = Math.sin(S.passi * 2.4) * (v2 > 0.004 ? 0.05 : 0.012);
      mani.position.y = osc;
      mani.rotation.z = osc * 0.6;
    } else {
      if (mani) mani.visible = false;
      var d = 3.7, h = 2.25;
      var cx = S.pos.x + Math.sin(S.ang) * d;
      var cz = S.pos.z + Math.cos(S.ang) * d;
      /* la telecamera non entra nei muri: se il posto dietro è occupato,
         si avvicina. È il problema più vecchio della terza persona. */
      var k = 1;
      while (k > 0.3 && !puoStare(S.pos.x + Math.sin(S.ang) * d * k,
                                  S.pos.z + Math.cos(S.ang) * d * k)) k -= 0.12;
      cx = S.pos.x + Math.sin(S.ang) * d * k;
      cz = S.pos.z + Math.cos(S.ang) * d * k;
      camera.position.set(cx, S.pos.y + h, cz);
      camera.lookAt(S.pos.x, S.pos.y + 1.15 + S.angY * 2, S.pos.z);
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     INTERAGIRE

     Quello che si può toccare è quello che si ha DAVANTI e VICINO: si
     calcola, non si indovina, e si scrive sullo schermo che cosa succede
     premendo. Un gioco che ti fa cercare il punto esatto in cui il tasto
     funziona non è difficile: è scomodo.
     ═════════════════════════════════════════════════════════════════════════ */
  function bersaglio() {
    var st = stanzaDi(S.pos.x, S.pos.z);
    if (!st) return null;
    var mi = null, md = 2.3;
    (st.oggetti || []).forEach(function (o) {
      if (o.preso || o.abbattuto) return;
      if (['elemento', 'foglio', 'banco', 'terminale'].indexOf(o.tipo) < 0) return;
      var ox = st.x + o.x, oz = st.z + o.z;
      var d = Math.hypot(S.pos.x - ox, S.pos.z - oz);
      if (d < md) { md = d; mi = o; }
    });
    return mi;
  }

  function interagisci() {
    var o = bersaglio();
    if (!o) return;
    if (o.tipo === 'elemento') {
      o.preso = true;
      if (o._nodo) o._nodo.visible = false;
      prendiElemento(o.sim);
    } else if (o.tipo === 'foglio') {
      o.preso = true;
      if (o._nodo) o._nodo.visible = false;
      leggiFoglio(o);
    } else if (o.tipo === 'banco') {
      schermo = 'sintesi'; fermaCiclo(); disegnaUI();
    } else if (o.tipo === 'terminale') {
      apriEnigma(o);
    }
  }

  function prendiElemento(sim) {
    var d = datiElemento(sim);
    var gia = S.inventario.filter(function (x) { return x.sim === sim; })[0];
    if (gia) { gia.usi++; }
    else S.inventario.push({ sim: sim, padronanza: 1, usi: 0 });
    if (S.codex.elementi.indexOf(sim) < 0) S.codex.elementi.push(sim);
    S.punti += 100;
    bip(880, 0.12, 'triangle', 0.07);
    avviso(t('Raccolto ', 'Collected ') + sim + ' · ' + (d.nome || sim) +
           (d.Z ? ' (Z ' + d.Z + ')' : ''),
           POTERI[sim] ? POTERI[sim].descr : '');
  }

  function leggiFoglio(o) {
    bip(520, 0.1, 'triangle', 0.05);
    if (o.id === 'ricettaHCl') sbloccaRicetta('HCl');
    if (o.id === 'notaCustode') {
      S.codex.consigli.push(t('Il Custode esegue istruzioni archiviate.',
                              'The Custodian runs archived instructions.'));
    }
    schermo = 'lettura';
    S._lettura = o.testo;
    fermaCiclo();
    disegnaUI();
  }

  function sbloccaRicetta(id) {
    var r = S.ricette.filter(function (x) { return x.id === id; })[0];
    if (r && !r.sbloccata) {
      r.sbloccata = true;
      var def = RICETTE.filter(function (x) { return x.id === id; })[0];
      avviso(t('Ricetta sbloccata: ', 'Recipe unlocked: ') + (def ? def.nome : id),
             def ? def.equazione : '');
      bip(1046, 0.16, 'triangle', 0.07);
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     POMPA 7 — il primo guardiano

     Tre fasi, e ognuna chiede una cosa di chimica diversa. Non si vince
     picchiando: si vince capendo di che cosa è fatto.

       1. LA RUGGINE — è coperta di ossido di ferro. Serve un ACIDO. L'acido
          cloridrico scioglie l'ossido: Fe₂O₃ + 6 HCl → 2 FeCl₃ + 3 H₂O.
          L'idrogeno da solo non fa niente, e una base nemmeno.
       2. IL VAPORE — nuda, chiude le valvole e riempie la stanza di vapore.
          Il SODIO reagisce con l'acqua: 2 Na + 2 H₂O → 2 NaOH + H₂, e il
          colpo di calore fa saltare le valvole.
       3. IL ROTORE — scoperto per pochi secondi: adesso qualunque cosa va.
     ═════════════════════════════════════════════════════════════════════════ */
  function passoBoss(o, st) {
    if (!o.attivo) {
      var d0 = Math.hypot(S.pos.x - (st.x + o.x), S.pos.z - (st.z + o.z));
      if (d0 < 9) {
        o.attivo = true; o.fase = 1; o.vita = 3; o.t = 0; o.sbuffo = 0;
        S.boss = o;
        bip(90, 0.5, 'sawtooth', 0.09);
        avviso(t('POMPA 7 · lega ferrosa, ossidata in superficie',
                 'PUMP 7 · ferrous alloy, oxidised on the surface'));
      }
      return;
    }
    o.t++;
    var dx = S.pos.x - (st.x + o.x), dz = S.pos.z - (st.z + o.z);
    var d = Math.hypot(dx, dz) || 1;
    /* si muove sui binari del soffitto: va avanti e indietro, e ti segue */
    o.x += (dx / d) * (o.fase === 2 ? 0.022 : 0.012);
    o.z += (dz / d) * (o.fase === 2 ? 0.022 : 0.012);
    o._nodo.position.set(st.x + o.x, 0, st.z + o.z);
    o._corpo.rotation.y = Math.atan2(dx, dz);
    o._corpo.position.y = Math.sin(o.t / 28) * 0.12;
    /* la girante gira, il volantino si avvita: una macchina ferma non spaventa */
    if (o._girante) o._girante.rotation.z += 0.22;
    if (o._volantino) o._volantino.rotation.z -= 0.05;
    /* la ruggine si vede finché c'è */
    if (o._ruggine) o._ruggine.visible = (o.fase === 1);
    o._occhi.forEach(function (e) {
      e.material.color.setHex(o.fase === 3 ? 0xfff07a : 0xff4d4d);
    });
    /* gli sbuffi di vapore */
    if (o.t % Math.round(110 / diff().danno) === 0) {
      o.sbuffo = 40;
      bip(220, 0.3, 'sawtooth', 0.05);
    }
    if (o.sbuffo > 0) {
      o.sbuffo--;
      if (d < 3.2) danno(t('lo sbuffo di vapore ti ha investito',
                           'the steam blast caught you'));
    }
    if (o.fase === 3) {
      o.finestra = (o.finestra == null ? 900 : o.finestra - 1);
      if (o.finestra <= 0) { o.fase = 2; o.finestra = null; }
    }
  }

  /* USARE QUALCOSA SUL GUARDIANO. Qui sta la regola del gioco: conta CHE
     COSA usi, non quante volte premi. */
  function usaSu(idComposto) {
    var o = S.boss;
    if (!o || !o.attivo) {
      avviso(t('Non c’è niente su cui usarlo', 'Nothing to use it on'));
      return false;
    }
    var def = RICETTE.filter(function (r) { return r.id === idComposto; })[0];
    var classe = def ? def.classe : '';
    var giusto = false, perche = '';
    if (o.fase === 1) {
      giusto = (idComposto === 'HCl');
      perche = giusto
        ? t('L’acido scioglie l’ossido: Fe₂O₃ + 6 HCl → 2 FeCl₃ + 3 H₂O',
            'The acid dissolves the oxide: Fe₂O₃ + 6 HCl → 2 FeCl₃ + 3 H₂O')
        : t('Sulla ruggine serve un acido: questo non la tocca',
            'Rust needs an acid: this does not touch it');
    } else if (o.fase === 2) {
      giusto = (idComposto === 'Na');
      perche = giusto
        ? t('2 Na + 2 H₂O → 2 NaOH + H₂: il calore fa saltare le valvole',
            '2 Na + 2 H₂O → 2 NaOH + H₂: the heat blows the valves')
        : t('Il metallo nudo non si scioglie: serve qualcosa che reagisca con ' +
            'il vapore', 'Bare metal will not dissolve: you need something that ' +
            'reacts with the steam');
    } else {
      giusto = true;
      perche = t('Il rotore è scoperto: qualunque cosa fa male',
                 'The rotor is exposed: anything hurts');
    }
    if (!giusto) {
      avviso(t('Niente. ', 'Nothing. ') + perche);
      bip(150, 0.14, 'square', 0.05);
      return false;
    }
    bip(620, 0.14, 'triangle', 0.08);
    o.vita--;
    avviso(perche);
    if (o.fase === 1 && o.vita <= 0) { o.fase = 2; o.vita = 3; S.punti += 300; }
    else if (o.fase === 2 && o.vita <= 0) { o.fase = 3; o.vita = 3; o.finestra = 900; S.punti += 300; }
    else if (o.fase === 3 && o.vita <= 0) vinciBoss(o);
    return true;
  }

  function vinciBoss(o) {
    o.abbattuto = true; o.attivo = false;
    if (o._nodo) o._nodo.visible = false;
    S.boss = null;
    S.punti += 1000;
    S.fatti.pompa7 = true;
    sbloccaRicetta('NaOH');
    S.codex.consigli.push(t('Gli acidi attaccano i metalli ossidati; le basi no.',
                            'Acids attack oxidised metals; bases do not.'));
    bip(880, 0.3, 'triangle', 0.09);
    S.finito = { esito: 'vinto' };
    schermo = 'esito';
    fermaCiclo();
    disegnaUI();
  }

  /* ═════════════════════════════════════════════════════════════════════════
     L'ENIGMA DEL TERMINALE 1 — la molecola

     Tre passi, crescenti: riconoscere un gruppo funzionale DISEGNATO, dare il
     nome IUPAC a una struttura DISEGNATA, e costruire la molecola. Le
     strutture sono disegnate, non scritte: è la differenza fra chiedere «che
     cos'è un alcol» e chiedere «questo che cos'è».
     ═════════════════════════════════════════════════════════════════════════ */
  var ENIGMA1 = function () {
    return [
      { tipo: 'riconosci',
        testo: t('Il terminale mostra una struttura. Che gruppo funzionale è ' +
                 'cerchiato?', 'The terminal shows a structure. Which functional ' +
                 'group is circled?'),
        disegno: 'etanolo-OH',
        opzioni: [t('ossidrile (alcol)', 'hydroxyl (alcohol)'),
                  t('carbonile (chetone)', 'carbonyl (ketone)'),
                  t('carbossile (acido)', 'carboxyl (acid)'),
                  t('ammina', 'amine')],
        giusta: 0,
        perche: t('Un −OH legato a un carbonio saturo è un ossidrile: la molecola ' +
                  'è un alcol.', 'An −OH bound to a saturated carbon is a hydroxyl: ' +
                  'the molecule is an alcohol.') },
      { tipo: 'nomina',
        testo: t('Qual è il nome IUPAC di questa struttura?',
                 'What is the IUPAC name of this structure?'),
        disegno: 'etanolo',
        opzioni: ['etanolo', 'metanolo', 'propan-2-olo', t('acido acetico', 'acetic acid')],
        giusta: 0,
        perche: t('Due atomi di carbonio (et-), tutti legami semplici (-an-), un ' +
                  'ossidrile (-olo): etanolo, C₂H₅OH.',
                  'Two carbons (eth-), all single bonds (-an-), one hydroxyl (-ol): ' +
                  'ethanol, C₂H₅OH.') },
      { tipo: 'costruisci',
        testo: t('Costruisci l’etanolo: scegli gli atomi nell’ordine della catena, ' +
                 'da sinistra.', 'Build ethanol: pick the atoms in chain order, from ' +
                 'the left.'),
        disegno: 'vuoto',
        catena: ['C', 'C', 'O'],
        scelte: ['C', 'O', 'N', 'S'],
        perche: t('C–C–O: due carboni e l’ossigeno dell’ossidrile in fondo.',
                  'C–C–O: two carbons and the hydroxyl oxygen at the end.') }
    ];
  };

  function apriEnigma(o) {
    if (S.fatti.paratia1) {
      avviso(t('Il terminale è già sbloccato', 'The terminal is already unlocked'));
      return;
    }
    S._enigma = { passi: ENIGMA1(), n: 0, oggetto: o, costruita: [] };
    schermo = 'enigma';
    fermaCiclo();
    disegnaUI();
    bip(520, 0.12, 'triangle', 0.05);
  }

  function rispondiEnigma(scelta) {
    var E = S._enigma;
    if (!E) return;
    var p = E.passi[E.n];
    var giusto;
    if (p.tipo === 'costruisci') {
      giusto = E.costruita.join('') === p.catena.join('');
    } else {
      giusto = (scelta === p.giusta);
    }
    if (!giusto) {
      bip(150, 0.2, 'square', 0.06);
      E.errori = (E.errori || 0) + 1;
      E.messaggio = t('No. ', 'No. ') + p.perche;
      E.costruita = [];
      disegnaUI();
      return;
    }
    bip(880, 0.12, 'triangle', 0.07);
    S.punti += 200;
    E.messaggio = p.perche;
    E.n++;
    if (E.n >= E.passi.length) {
      S.fatti.paratia1 = true;
      sbloccaRicetta('H2O2');
      S.codex.molecole.push('etanolo');
      avviso(t('Paratia 1 sbloccata', 'Bulkhead 1 unlocked'),
             t('Il terminale apre la sala pompe', 'The terminal opens the pump room'));
      schermo = 'gioco';
      S._enigma = null;
      avviaCiclo();
    }
    disegnaUI();
  }

  /* le strutture, disegnate: una sola casa per disegnare una molecola in
     questo gioco, e disegna linee e lettere come una formula di struttura */
  function disegnaStruttura(cv, quale) {
    var q = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    q.clearRect(0, 0, W, H);
    q.strokeStyle = '#eaf6ff'; q.fillStyle = '#eaf6ff';
    q.lineWidth = 2; q.font = 'bold 15px ui-monospace, monospace';
    q.textAlign = 'center'; q.textBaseline = 'middle';
    function legame(x1, y1, x2, y2) {
      q.beginPath(); q.moveTo(x1, y1); q.lineTo(x2, y2); q.stroke();
    }
    function atomo(x, y, testo, colore) {
      q.fillStyle = '#0a1420';
      q.beginPath(); q.arc(x, y, 11, 0, 6.2832); q.fill();
      q.fillStyle = colore || '#eaf6ff';
      q.fillText(testo, x, y);
    }
    var cx = W / 2, cy = H / 2;
    if (quale === 'etanolo' || quale === 'etanolo-OH') {
      legame(cx - 60, cy + 14, cx - 10, cy - 14);
      legame(cx - 10, cy - 14, cx + 40, cy + 14);
      atomo(cx - 60, cy + 14, 'CH₃');
      atomo(cx - 10, cy - 14, 'CH₂');
      atomo(cx + 40, cy + 14, 'OH', '#7fd4ff');
      if (quale === 'etanolo-OH') {
        q.strokeStyle = '#ffd93d'; q.lineWidth = 2;
        q.beginPath(); q.arc(cx + 40, cy + 14, 19, 0, 6.2832); q.stroke();
      }
    } else if (quale === 'vuoto') {
      q.strokeStyle = '#3a4a5e';
      q.setLineDash([4, 4]);
      legame(cx - 60, cy, cx - 10, cy);
      legame(cx - 10, cy, cx + 40, cy);
      q.setLineDash([]);
      var E = S._enigma;
      (E ? E.costruita : []).forEach(function (a, i) {
        atomo(cx - 60 + i * 50, cy, a, '#5eead4');
      });
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     L'INTERFACCIA

     Tutto quello che si legge è HTML sopra la scena: un menu disegnato dentro
     la tela a 320×240 sarebbe illeggibile, e i lettori di schermo non lo
     vedrebbero affatto. La scena è il gioco; l'interfaccia è interfaccia.
     ═════════════════════════════════════════════════════════════════════════ */
  function stile() {
    if (document.getElementById('bsiAP-stile')) return;
    var s = document.createElement('style');
    s.id = 'bsiAP-stile';
    s.textContent = [
      '#bsiAP-scena{position:relative;margin:0 auto;aspect-ratio:4/3;',
      ' width:min(100%,calc((100dvh - 230px) * 4 / 3));background:#05080c;',
      ' border:2px solid #1e3a52;border-radius:8px;overflow:hidden}',
      /* I PIXEL RESTANO QUADRATI: è metà dello stile PS1 */
      '#bsiAP-tela{position:absolute;inset:0;width:100%;height:100%;display:block;',
      ' image-rendering:pixelated;image-rendering:crisp-edges;z-index:1}',
      '#bsiAP-ui{position:absolute;inset:0;z-index:2;display:flex;',
      ' align-items:center;justify-content:center;padding:10px;box-sizing:border-box;',
      ' pointer-events:none;font-family:ui-monospace,monospace}',
      '#bsiAP-ui.attiva{pointer-events:auto;background:rgba(3,7,12,.88)}',
      '#bsiAP-ui.attiva .bsiAP-scheda{max-height:100%;overflow:auto}',
      '.bsiAP-scheda{max-width:470px;width:100%;color:#dfe9f5;text-align:center}',
      '.bsiAP-tit{font-size:19px;font-weight:800;color:#8fe3c4;letter-spacing:.08em;',
      ' margin:0 0 10px;text-shadow:2px 2px 0 #06202a}',
      '.bsiAP-sub{font-size:12px;color:#aebccd;line-height:1.6;margin:0 0 12px}',
      '.bsiAP-b{display:block;width:100%;margin:5px 0;padding:10px 12px;',
      ' border-radius:4px;border:2px solid #2a4a66;background:#0b1a26;color:#dfe9f5;',
      ' font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;',
      ' letter-spacing:.04em;text-align:left}',
      '.bsiAP-b:hover,.bsiAP-b:focus-visible{border-color:#8fe3c4;background:#12303f;',
      ' outline:none;color:#fff}',
      '.bsiAP-b.on{border-color:#8fe3c4;background:#143d4a}',
      '.bsiAP-riga{display:flex;gap:6px;align-items:center;justify-content:space-between;',
      ' margin:6px 0;font-size:12px}',
      '.bsiAP-riga b{color:#8fe3c4;font-weight:700}',
      '.bsiAP-opz{display:flex;gap:4px;flex-wrap:wrap}',
      '.bsiAP-opz button{padding:6px 10px;border-radius:4px;border:2px solid #2a4a66;',
      ' background:#0b1a26;color:#dfe9f5;font-family:inherit;font-size:11px;cursor:pointer}',
      '.bsiAP-opz button.on{border-color:#8fe3c4;background:#143d4a;color:#fff}',
      '.bsiAP-griglia{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));',
      ' gap:6px;margin:8px 0}',
      '.bsiAP-el{border:2px solid #2a4a66;border-radius:4px;background:#0b1a26;',
      ' padding:7px;cursor:pointer;text-align:left}',
      '.bsiAP-el:hover,.bsiAP-el.on{border-color:#8fe3c4;background:#143d4a}',
      '.bsiAP-el b{display:block;font-size:16px;color:#8fe3c4}',
      '.bsiAP-el span{display:block;font-size:10px;color:#9fb0c4}',
      '.bsiAP-barra{height:5px;background:#16293a;border-radius:3px;margin-top:4px}',
      '.bsiAP-barra i{display:block;height:100%;background:#8fe3c4;border-radius:3px}',
      /* il quadro in alto, sempre visibile mentre si gioca */
      '#bsiAP-hud{position:absolute;inset:0;z-index:3;pointer-events:none;',
      ' font-family:ui-monospace,monospace;color:#dfe9f5;font-size:11px}',
      '#bsiAP-hud .alto{position:absolute;top:0;left:0;right:0;display:flex;',
      ' justify-content:space-between;padding:6px 8px;background:linear-gradient(',
      ' rgba(3,7,12,.8),transparent)}',
      '#bsiAP-hud .basso{position:absolute;bottom:0;left:0;right:0;padding:6px 8px;',
      ' text-align:center;text-shadow:1px 1px 0 #000}',
      '#bsiAP-avviso{position:absolute;left:50%;transform:translateX(-50%);bottom:34px;',
      ' background:rgba(3,10,16,.92);border:1px solid #2a4a66;border-radius:4px;',
      ' padding:6px 10px;max-width:86%;font-size:11px;line-height:1.5;opacity:0;',
      ' transition:opacity .2s;z-index:4;pointer-events:none;text-align:center}',
      '#bsiAP-avviso.on{opacity:1}',
      /* i comandi a schermo: pollici, non mouse */
      '#bsiAP-comandi{display:flex;justify-content:space-between;align-items:flex-end;',
      ' gap:8px;margin-top:8px;user-select:none;-webkit-user-select:none}',
      '.bsiAP-croce{display:grid;grid-template-columns:repeat(3,46px);',
      ' grid-template-rows:repeat(2,46px);gap:4px}',
      '.bsiAP-t{border-radius:6px;border:2px solid #2a4a66;background:#0b1a26;',
      ' color:#cfe2f5;font-size:17px;font-weight:800;cursor:pointer;touch-action:none;',
      ' display:flex;align-items:center;justify-content:center;font-family:inherit;',
      ' width:46px;height:46px}',
      '.bsiAP-t.giu,.bsiAP-t:active{background:#1b4150;border-color:#8fe3c4}',
      '.bsiAP-az{display:grid;grid-template-columns:repeat(3,46px);gap:4px}',
      'body.bsiAP-pieno #bsiAP-scena{position:fixed;inset:0;width:100vw;height:100dvh;',
      ' max-width:none;aspect-ratio:auto;border:0;border-radius:0;z-index:9998}',
      'body.bsiAP-pieno #bsiAP-comandi{position:fixed;left:10px;right:10px;',
      ' bottom:max(12px,env(safe-area-inset-bottom));z-index:9999;margin:0}',
      'body.bsiAP-pieno{overflow:hidden}'
    ].join('');
    document.head.appendChild(s);
  }

  function sezione() {
    var s = document.getElementById(ID);
    if (s) return s;
    var main = document.getElementById('main') || document.body;
    var rif = document.querySelector('.section');
    s = document.createElement('div');
    s.id = ID;
    s.className = 'section';
    s.innerHTML =
      '<div class="section-title">' + NOME + '</div>' +
      '<div id="bsiAP-intro" style="color:#9fb3c8;font-size:.9rem;margin-bottom:10px;' +
        'max-width:880px;line-height:1.65"></div>' +
      '<div id="bsiAP-scena">' +
        '<div id="bsiAP-ui"></div>' +
        '<div id="bsiAP-hud"></div>' +
        '<div id="bsiAP-avviso"></div>' +
      '</div>' +
      '<div id="bsiAP-comandi"></div>' +
      '<div id="bsiAP-sotto" style="margin-top:12px"></div>';
    if (rif && rif.parentNode) rif.parentNode.appendChild(s);
    else main.appendChild(s);
    return s;
  }

  function intro() {
    var i = document.getElementById('bsiAP-intro');
    if (!i) return;
    i.innerHTML = t(
      '<b>Esplorazione in tre dimensioni, stile PlayStation 1.</b> Sei un chimico ' +
      'chiuso dentro un istituto sigillato: cammini, apri porte, raccogli ' +
      '<b>elementi</b>, li <b>sintetizzi</b> in composti al banco e usi la chimica ' +
      'per risolvere gli enigmi e abbattere i guardiani. Visuale in <b>terza o ' +
      'prima persona</b> (si sceglie nelle impostazioni, e si ricorda). Quattro ' +
      'difficoltà, dal «Facile» all’«Esperimento», dove la sintesi rapida è vietata ' +
      'e le reazioni vanno bilanciate. Funziona <b>offline</b>.',
      '<b>Three-dimensional exploration, PlayStation 1 style.</b> You are a chemist ' +
      'locked inside a sealed institute: you walk, open doors, collect ' +
      '<b>elements</b>, <b>synthesise</b> them into compounds at the bench and use ' +
      'chemistry to solve puzzles and bring down the guardians. <b>Third or first ' +
      'person</b> view (chosen in the settings, and remembered). Four difficulties, ' +
      'from «Easy» to «Experiment», where quick synthesis is forbidden and ' +
      'reactions must be balanced. Works <b>offline</b>.');
  }

  var tAvviso = null;
  function avviso(testo, extra) {
    var a = document.getElementById('bsiAP-avviso');
    if (!a) return;
    a.innerHTML = esc(testo) + (extra ? '<br><span style="color:#8fe3c4">' +
                                        esc(extra) + '</span>' : '');
    a.classList.add('on');
    clearTimeout(tAvviso);
    tAvviso = setTimeout(function () { a.classList.remove('on'); }, 2800);
  }

  function ui() { return document.getElementById('bsiAP-ui'); }

  function hud() {
    var h = document.getElementById('bsiAP-hud');
    if (!h) return;
    if (schermo !== 'gioco' || !S) { h.innerHTML = ''; return; }
    var st = stanzaDi(S.pos.x, S.pos.z);
    var b = bersaglio();
    var azione = '';
    if (b) {
      azione = b.tipo === 'elemento' ? t('✋ raccogli ', '✋ take ') + b.sim
             : b.tipo === 'foglio' ? t('✋ leggi', '✋ read')
             : b.tipo === 'banco' ? t('✋ laboratorio di sintesi', '✋ synthesis lab')
             : t('✋ usa il terminale', '✋ use the terminal');
    }
    var comp = S.composti.map(function (c) {
      var d = RICETTE.filter(function (r) { return r.id === c.id; })[0];
      return (d ? d.formula : c.id) + '×' + c.dosi;
    }).join(' · ');
    h.innerHTML =
      '<div class="alto"><span>' + '♥'.repeat(Math.max(0, S.vite)) + '</span>' +
      '<span>' + esc(st ? st.nome : '') + '</span>' +
      '<span>' + String(S.punti).padStart(5, '0') + '</span></div>' +
      '<div class="basso">' + (azione ? '<b style="color:#8fe3c4">' + azione + '</b>' : '') +
      (comp ? '<br><span style="color:#9fb0c4">' + esc(comp) + '</span>' : '') +
      (S.boss && S.boss.attivo ? '<br><span style="color:#ff8f8f">POMPA 7 · ' +
        t('fase ', 'phase ') + S.boss.fase + '</span>' : '') + '</div>';
  }

  function disegnaUI() {
    stile();
    var u = ui();
    if (!u) return;
    hud();
    u.className = (schermo === 'gioco') ? '' : 'attiva';
    if (schermo === 'gioco') { u.innerHTML = ''; comandi(); return; }

    if (schermo === 'titolo') {
      u.innerHTML = '<div class="bsiAP-scheda">' +
        '<div class="bsiAP-tit" style="font-size:26px">' + NOME + '</div>' +
        '<div class="bsiAP-sub">' +
          t('— protocollo di contenimento —', '— containment protocol —') + '</div>' +
        '<button class="bsiAP-b" id="apNuova">▸ ' +
          t('NUOVA PARTITA', 'NEW GAME') + '</button>' +
        '<button class="bsiAP-b" id="apImp">⚙ ' +
          t('IMPOSTAZIONI', 'SETTINGS') + '</button>' +
        '<button class="bsiAP-b" id="apCodex">📖 CODEX</button>' +
        '<div class="bsiAP-sub" style="margin-top:10px;font-size:10.5px">' +
          t('visuale: ', 'view: ') + '<b>' +
          (IMP.visuale === 'prima' ? t('prima persona', 'first person')
                                   : t('terza persona', 'third person')) +
          '</b> · ' + t('difficoltà: ', 'difficulty: ') + '<b>' + diff().nome +
          '</b></div></div>';
      document.getElementById('apNuova').onclick = function () {
        nuovaPartita(); cominciaPartita();
      };
      document.getElementById('apImp').onclick = function () {
        schermo = 'impostazioni'; disegnaUI();
      };
      document.getElementById('apCodex').onclick = function () {
        schermo = 'codex'; disegnaUI();
      };
      return;
    }

    if (schermo === 'impostazioni') {
      function gruppo(etichetta, chiave, valori) {
        var h = '<div class="bsiAP-riga"><b>' + etichetta + '</b><span class="bsiAP-opz">';
        valori.forEach(function (v) {
          h += '<button data-k="' + chiave + '" data-v="' + v[0] + '"' +
               (IMP[chiave] === v[0] ? ' class="on"' : '') + '>' + v[1] + '</button>';
        });
        return h + '</span></div>';
      }
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">⚙ ' + t('IMPOSTAZIONI', 'SETTINGS') + '</div>' +
        gruppo(t('Visuale', 'View'), 'visuale',
               [['terza', t('terza persona', 'third person')],
                ['prima', t('prima persona', 'first person')]]) +
        gruppo(t('Difficoltà', 'Difficulty'), 'difficolta',
               [['facile', DIFFICOLTA.facile.nome], ['normale', DIFFICOLTA.normale.nome],
                ['difficile', DIFFICOLTA.difficile.nome],
                ['esperimento', DIFFICOLTA.esperimento.nome]]) +
        gruppo(t('Filtro PS1', 'PS1 filter'), 'ps1',
               [['pieno', t('pieno', 'full')], ['ridotto', t('ridotto', 'reduced')],
                ['spento', t('spento', 'off')]]) +
        gruppo(t('Risoluzione', 'Resolution'), 'risoluzione',
               [['320', '320×240'], ['480', '480×360'], ['640', '640×480']]) +
        gruppo(t('Suono', 'Sound'), 'suono',
               [['acceso', t('acceso', 'on')], ['spento', t('spento', 'off')]]) +
        '<div class="bsiAP-sub" style="margin-top:10px">' +
          t('La difficoltà cambia vite, danno, tempo degli enigmi e se la sintesi ' +
            'rapida è permessa. A «Esperimento» le reazioni vanno bilanciate.',
            'Difficulty changes lives, damage, puzzle time and whether quick ' +
            'synthesis is allowed. On «Experiment» reactions must be balanced.') +
        '</div>' +
        '<button class="bsiAP-b" id="apIndietro">◂ ' + t('indietro', 'back') +
        '</button></div>';
      [].forEach.call(u.querySelectorAll('[data-k]'), function (b) {
        b.onclick = function () {
          scriviImp(b.getAttribute('data-k'), b.getAttribute('data-v'));
          /* la risoluzione e il filtro cambiano il motore: si riapplicano subito */
          if (b.getAttribute('data-k') === 'risoluzione') applicaRisoluzione();
          if (b.getAttribute('data-k') === 'ps1' && pronto) { materiali(); ricostruisci(); }
          disegnaUI();
          bip(660, 0.05, 'square', 0.04);
        };
      });
      document.getElementById('apIndietro').onclick = function () {
        schermo = S ? 'pausa' : 'titolo'; disegnaUI();
      };
      return;
    }

    if (schermo === 'codex') {
      var el = (S ? S.codex.elementi : []).map(function (sim) {
        var d = datiElemento(sim), p = POTERI[sim] || {};
        return '<div class="bsiAP-el"><b>' + sim + '</b><span>' + esc(d.nome || '') +
               (d.Z ? ' · Z ' + d.Z : '') + '</span><span>' + esc(p.potere || '') +
               '</span></div>';
      }).join('');
      var ric = RICETTE.map(function (r) {
        var sb = S && S.ricette.filter(function (x) { return x.id === r.id; })[0];
        var aperta = sb && sb.sbloccata;
        return '<div class="bsiAP-el" style="cursor:default">' +
          '<b>' + (aperta ? r.formula : '???') + '</b><span>' +
          (aperta ? esc(r.nome) + ' · ' + esc(r.classe) : t('non ancora trovata',
                                                            'not found yet')) +
          '</span><span style="color:#7f93a8">' +
          (aperta ? esc(r.equazione) : esc(r.dove)) + '</span></div>';
      }).join('');
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">📖 CODEX</div>' +
        '<div class="bsiAP-sub">' + t('Elementi', 'Elements') + '</div>' +
        '<div class="bsiAP-griglia">' + (el || '<span class="bsiAP-sub">' +
          t('nessuno, ancora', 'none yet') + '</span>') + '</div>' +
        '<div class="bsiAP-sub">' + t('Sintesi', 'Synthesis') + '</div>' +
        '<div class="bsiAP-griglia">' + ric + '</div>' +
        ((S && S.codex.consigli.length) ? '<div class="bsiAP-sub">' +
          t('Consigli', 'Tips') + '</div><div class="bsiAP-sub">• ' +
          S.codex.consigli.map(esc).join('<br>• ') + '</div>' : '') +
        '<button class="bsiAP-b" id="apIndietro2">◂ ' + t('indietro', 'back') +
        '</button></div>';
      document.getElementById('apIndietro2').onclick = function () {
        schermo = S && S.pos ? 'pausa' : 'titolo'; disegnaUI();
      };
      return;
    }

    if (schermo === 'lettura') {
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">📄 ' + t('APPUNTO', 'NOTE') + '</div>' +
        '<div class="bsiAP-sub">' + esc(S._lettura || '') + '</div>' +
        '<button class="bsiAP-b" id="apChiudi">' + t('chiudi', 'close') +
        '</button></div>';
      document.getElementById('apChiudi').onclick = function () {
        schermo = 'gioco'; disegnaUI(); avviaCiclo();
      };
      return;
    }

    if (schermo === 'inventario') {
      var inv = S.inventario.map(function (x) {
        var d = datiElemento(x.sim), p = POTERI[x.sim] || {};
        return '<div class="bsiAP-el" data-sim="' + x.sim + '"><b>' + x.sim + '</b>' +
          '<span>' + esc(d.nome || '') + (d.Z ? ' · Z ' + d.Z : '') + '</span>' +
          '<span>' + esc(p.potere || '') + '</span>' +
          '<div class="bsiAP-barra"><i style="width:' + (x.padronanza * 20) + '%"></i></div>' +
          '<span style="color:#7f93a8">' + t('padronanza ', 'mastery ') +
          x.padronanza + '/5</span></div>';
      }).join('');
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">🎒 ' + t('INVENTARIO', 'INVENTORY') + '</div>' +
        '<div class="bsiAP-griglia">' + (inv || '<span class="bsiAP-sub">' +
          t('vuoto: cerca gli elementi nelle stanze',
            'empty: look for elements in the rooms') + '</span>') + '</div>' +
        '<div class="bsiAP-sub" id="apDettaglio"></div>' +
        '<button class="bsiAP-b" id="apChiudiInv">' + t('chiudi', 'close') +
        '</button></div>';
      [].forEach.call(u.querySelectorAll('[data-sim]'), function (b) {
        b.onclick = function () {
          var sim = b.getAttribute('data-sim');
          var d = datiElemento(sim), p = POTERI[sim] || {};
          document.getElementById('apDettaglio').innerHTML =
            '<b style="color:#8fe3c4">' + sim + ' · ' + esc(d.nome || '') + '</b><br>' +
            (d.massa ? t('massa ', 'mass ') + d.massa + ' u · ' : '') +
            (d.gruppo ? t('gruppo ', 'group ') + d.gruppo + ' · ' : '') +
            (d.periodo ? t('periodo ', 'period ') + d.periodo + ' · ' : '') +
            (d.en ? 'χ ' + d.en + ' · ' : '') +
            (d.ion ? 'Eion ' + d.ion + ' eV' : '') + '<br>' +
            esc(p.descr || '') + (d.nota ? '<br><span style="color:#7f93a8">' +
            esc(String(d.nota).slice(0, 150)) + '</span>' : '');
        };
      });
      document.getElementById('apChiudiInv').onclick = function () {
        schermo = 'gioco'; disegnaUI(); avviaCiclo();
      };
      return;
    }

    if (schermo === 'sintesi') { schermoSintesi(u); return; }
    if (schermo === 'enigma') { schermoEnigma(u); return; }

    if (schermo === 'pausa') {
      u.innerHTML = '<div class="bsiAP-scheda">' +
        '<div class="bsiAP-tit">❚❚ ' + t('IN PAUSA', 'PAUSED') + '</div>' +
        '<div class="bsiAP-sub">' + esc(diff().nome) + ' · ♥ ' + S.vite +
          ' · ' + S.punti + t(' punti', ' points') + '</div>' +
        '<button class="bsiAP-b" id="apRiprendi">▸ ' + t('riprendi', 'resume') + '</button>' +
        '<button class="bsiAP-b" id="apInv">🎒 ' + t('inventario', 'inventory') + '</button>' +
        '<button class="bsiAP-b" id="apCod">📖 codex</button>' +
        '<button class="bsiAP-b" id="apImp2">⚙ ' + t('impostazioni', 'settings') + '</button>' +
        '<button class="bsiAP-b" id="apAbbandona">' + t('abbandona', 'give up') +
        '</button></div>';
      document.getElementById('apRiprendi').onclick = function () {
        schermo = 'gioco'; disegnaUI(); avviaCiclo();
      };
      document.getElementById('apInv').onclick = function () { schermo = 'inventario'; disegnaUI(); };
      document.getElementById('apCod').onclick = function () { schermo = 'codex'; disegnaUI(); };
      document.getElementById('apImp2').onclick = function () { schermo = 'impostazioni'; disegnaUI(); };
      document.getElementById('apAbbandona').onclick = function () {
        S = null; schermo = 'titolo'; disegnaUI();
      };
      return;
    }

    if (schermo === 'esito') {
      var vinto = S.finito && S.finito.esito === 'vinto';
      u.innerHTML = '<div class="bsiAP-scheda">' +
        '<div class="bsiAP-tit">' + (vinto ? t('POMPA 7 FERMATA', 'PUMP 7 STOPPED')
                                           : t('CONTENIMENTO FALLITO', 'CONTAINMENT FAILED')) +
        '</div><div class="bsiAP-sub">' +
        (vinto ? t('La paratia si apre sul reparto successivo. Ricetta NaOH ' +
                   'sbloccata.', 'The bulkhead opens onto the next wing. NaOH recipe ' +
                   'unlocked.')
               : esc(S.finito ? S.finito.perche : '')) +
        '<br>' + S.punti + t(' punti', ' points') + '</div>' +
        '<button class="bsiAP-b" id="apAncora">' + t('riprova', 'try again') + '</button>' +
        '<button class="bsiAP-b" id="apTitolo">' + t('torna al titolo', 'back to title') +
        '</button></div>';
      document.getElementById('apAncora').onclick = function () {
        nuovaPartita(); cominciaPartita();
      };
      document.getElementById('apTitolo').onclick = function () {
        S = null; schermo = 'titolo'; disegnaUI();
      };
      return;
    }
  }

  /* ── il laboratorio di sintesi ───────────────────────────────────────── */
  var selezione = [];

  function schermoSintesi(u) {
    var inv = S.inventario.map(function (x) {
      return '<div class="bsiAP-el' + (selezione.indexOf(x.sim) >= 0 ? ' on' : '') +
        '" data-sim="' + x.sim + '"><b>' + x.sim + '</b><span>' +
        t('padronanza ', 'mastery ') + x.padronanza + '/5</span></div>';
    }).join('');
    var trovata = ricettaPer(selezione);
    var note = RICETTE.filter(function (r) {
      var sb = S.ricette.filter(function (x) { return x.id === r.id; })[0];
      return sb && sb.sbloccata;
    });
    u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
      '<div class="bsiAP-tit">⚗ ' + t('LABORATORIO DI SINTESI', 'SYNTHESIS LAB') + '</div>' +
      '<div class="bsiAP-sub">' + t('Scegli i reagenti:', 'Pick the reagents:') + '</div>' +
      '<div class="bsiAP-griglia">' + (inv || '<span class="bsiAP-sub">' +
        t('non hai elementi', 'you have no elements') + '</span>') + '</div>' +
      '<div class="bsiAP-sub" style="min-height:40px">' +
        (selezione.length ? '<b>' + selezione.join(' + ') + '</b> → ' +
          (trovata ? '<b style="color:#8fe3c4">' + trovata.formula + '</b> · ' +
            esc(trovata.nome) + '<br><span style="color:#7f93a8">' +
            esc(trovata.equazione) + ' · ' + esc(trovata.usa) + '</span>'
            : t('niente di noto: queste due cose non reagiscono così',
                'nothing known: these do not react that way'))
          : t('nessun reagente scelto', 'no reagent selected')) + '</div>' +
      '<button class="bsiAP-b" id="apFai"' + (trovata ? '' : ' disabled') + '>' +
        t('SINTETIZZA', 'SYNTHESISE') + '</button>' +
      '<div class="bsiAP-sub">' + t('Ricette conosciute: ', 'Known recipes: ') +
        note.length + '/' + RICETTE.length + '</div>' +
      '<button class="bsiAP-b" id="apChiudiSin">' + t('chiudi', 'close') + '</button></div>';
    [].forEach.call(u.querySelectorAll('[data-sim]'), function (b) {
      b.onclick = function () {
        var sim = b.getAttribute('data-sim');
        var k = selezione.indexOf(sim);
        if (k >= 0) selezione.splice(k, 1);
        else if (selezione.length < 3) selezione.push(sim);
        bip(560, 0.04, 'square', 0.04);
        disegnaUI();
      };
    });
    var fai = document.getElementById('apFai');
    if (fai) fai.onclick = function () {
      var r = ricettaPer(selezione);
      if (!r) return;
      sintetizza(r);
      selezione = [];
      disegnaUI();
    };
    document.getElementById('apChiudiSin').onclick = function () {
      selezione = [];
      schermo = 'gioco'; disegnaUI(); avviaCiclo();
    };
  }

  function ricettaPer(scelti) {
    if (!scelti.length) return null;
    var chiave = scelti.slice().sort().join('+');
    var r = RICETTE.filter(function (x) {
      return x.reagenti.slice().sort().join('+') === chiave;
    })[0];
    if (!r) return null;
    var sb = S.ricette.filter(function (x) { return x.id === r.id; })[0];
    return (sb && sb.sbloccata) ? r : null;
  }

  function sintetizza(r) {
    /* la resa dipende dalla padronanza media dei reagenti */
    var pad = r.reagenti.map(function (sim) {
      var x = S.inventario.filter(function (y) { return y.sim === sim; })[0];
      return x ? x.padronanza : 0;
    });
    var media = pad.reduce(function (a, b) { return a + b; }, 0) / pad.length;
    var dosi = Math.max(1, Math.round(media));
    var c = S.composti.filter(function (x) { return x.id === r.id; })[0];
    if (c) c.dosi += dosi; else S.composti.push({ id: r.id, dosi: dosi });
    /* i reagenti si consumano, tranne quelli a padronanza 5, e l'uso fa
       crescere la padronanza: si impara usando */
    r.reagenti.forEach(function (sim) {
      var x = S.inventario.filter(function (y) { return y.sim === sim; })[0];
      if (!x) return;
      x.usi++;
      if (x.usi % 3 === 0 && x.padronanza < 5) x.padronanza++;
    });
    if (S.codex.reazioni.indexOf(r.equazione) < 0) S.codex.reazioni.push(r.equazione);
    S.punti += 150;
    bip(760, 0.18, 'triangle', 0.07);
    avviso(t('Sintetizzato ', 'Synthesised ') + r.formula + ' ×' + dosi, r.equazione);
  }

  /* ── l'enigma ────────────────────────────────────────────────────────── */
  function schermoEnigma(u) {
    var E = S._enigma;
    if (!E) { schermo = 'gioco'; return; }
    var p = E.passi[E.n];
    var h = '<div class="bsiAP-scheda" style="text-align:left">' +
      '<div class="bsiAP-tit">🖥 ' + t('TERMINALE 1', 'TERMINAL 1') +
      ' · ' + (E.n + 1) + '/' + E.passi.length + '</div>' +
      '<canvas id="apStruttura" width="300" height="110" ' +
        'style="width:100%;max-width:300px;display:block;margin:0 auto 8px;' +
        'background:#071018;border:1px solid #2a4a66;border-radius:4px;' +
        'image-rendering:pixelated"></canvas>' +
      '<div class="bsiAP-sub">' + esc(p.testo) + '</div>';
    if (p.tipo === 'costruisci') {
      h += '<div class="bsiAP-opz" style="justify-content:center">' +
        p.scelte.map(function (a) {
          return '<button data-atomo="' + a + '">' + a + '</button>';
        }).join('') + '</div>' +
        '<button class="bsiAP-b" id="apVerifica">' + t('verifica', 'check') + '</button>' +
        '<button class="bsiAP-b" id="apPulisci">' + t('cancella', 'clear') + '</button>';
    } else {
      p.opzioni.forEach(function (o, k) {
        h += '<button class="bsiAP-b" data-op="' + k + '">' + esc(o) + '</button>';
      });
    }
    if (E.messaggio) h += '<div class="bsiAP-sub" style="color:#8fe3c4">' +
      esc(E.messaggio) + '</div>';
    h += '<button class="bsiAP-b" id="apEsci">' + t('allontanati', 'step away') +
      '</button></div>';
    u.innerHTML = h;
    var cv = document.getElementById('apStruttura');
    if (cv) disegnaStruttura(cv, p.disegno);
    [].forEach.call(u.querySelectorAll('[data-op]'), function (b) {
      b.onclick = function () { rispondiEnigma(+b.getAttribute('data-op')); };
    });
    [].forEach.call(u.querySelectorAll('[data-atomo]'), function (b) {
      b.onclick = function () {
        if (E.costruita.length < 3) E.costruita.push(b.getAttribute('data-atomo'));
        bip(600, 0.04, 'square', 0.04);
        disegnaUI();
      };
    });
    var ver = document.getElementById('apVerifica');
    if (ver) ver.onclick = function () { rispondiEnigma(null); };
    var pul = document.getElementById('apPulisci');
    if (pul) pul.onclick = function () { E.costruita = []; disegnaUI(); };
    document.getElementById('apEsci').onclick = function () {
      S._enigma = null; schermo = 'gioco'; disegnaUI(); avviaCiclo();
    };
  }

  /* ── i comandi a schermo ─────────────────────────────────────────────── */
  function comandi() {
    var c = document.getElementById('bsiAP-comandi');
    if (!c || c.getAttribute('data-pronti') === '1') return;
    c.setAttribute('data-pronti', '1');
    c.innerHTML =
      '<div class="bsiAP-croce">' +
        '<button class="bsiAP-t" data-k="latSx" aria-label="' + t('a sinistra', 'strafe left') + '">⇤</button>' +
        '<button class="bsiAP-t" data-k="su" aria-label="' + t('avanti', 'forward') + '">▲</button>' +
        '<button class="bsiAP-t" data-k="latDx" aria-label="' + t('a destra', 'strafe right') + '">⇥</button>' +
        '<button class="bsiAP-t" data-k="sx" aria-label="' + t('gira a sinistra', 'turn left') + '">◀</button>' +
        '<button class="bsiAP-t" data-k="giu" aria-label="' + t('indietro', 'back') + '">▼</button>' +
        '<button class="bsiAP-t" data-k="dx" aria-label="' + t('gira a destra', 'turn right') + '">▶</button>' +
      '</div>' +
      '<div class="bsiAP-az">' +
        '<button class="bsiAP-t" id="apB-inv" aria-label="' + t('inventario', 'inventory') + '">🎒</button>' +
        '<button class="bsiAP-t" id="apB-cod" aria-label="codex">📖</button>' +
        '<button class="bsiAP-t" id="apB-pausa" aria-label="' + t('pausa', 'pause') + '">❚❚</button>' +
        '<button class="bsiAP-t" data-k="salto" aria-label="' + t('salta', 'jump') + '">⤒</button>' +
        '<button class="bsiAP-t" id="apB-usa" aria-label="' + t('interagisci', 'interact') + '">✋</button>' +
        '<button class="bsiAP-t" id="apB-pot" aria-label="' + t('usa il composto', 'use the compound') + '">✦</button>' +
      '</div>';
    [].forEach.call(c.querySelectorAll('[data-k]'), function (b) {
      var k = b.getAttribute('data-k');
      function giu(e) { e.preventDefault(); tasti[k] = true; b.classList.add('giu'); }
      function su(e) { if (e) e.preventDefault(); tasti[k] = false; b.classList.remove('giu'); }
      b.addEventListener('pointerdown', giu);
      b.addEventListener('pointerup', su);
      b.addEventListener('pointercancel', su);
      b.addEventListener('pointerleave', su);
      b.addEventListener('lostpointercapture', su);
    });
    document.getElementById('apB-usa').onclick = function () { interagisci(); };
    document.getElementById('apB-pot').onclick = function () { usaRapido(); };
    document.getElementById('apB-inv').onclick = function () {
      schermo = 'inventario'; fermaCiclo(); disegnaUI();
    };
    document.getElementById('apB-cod').onclick = function () {
      schermo = 'codex'; fermaCiclo(); disegnaUI();
    };
    document.getElementById('apB-pausa').onclick = function () {
      schermo = 'pausa'; fermaCiclo(); disegnaUI();
    };
  }

  /* usare il primo composto che si ha: la scorciatoia del combattimento */
  function usaRapido() {
    if (!S.composti.length) {
      avviso(t('Non hai composti: vai al banco di sintesi',
               'You have no compounds: go to the synthesis bench'));
      return;
    }
    var c = S.composti[0];
    if (usaSu(c.id)) {
      c.dosi--;
      if (c.dosi <= 0) S.composti.splice(0, 1);
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL CICLO E L'AVVIO
     ═════════════════════════════════════════════════════════════════════════ */
  function visibile() {
    var s = document.getElementById(ID);
    return !!(s && getComputedStyle(s).display !== 'none');
  }

  function ciclo(ora) {
    anim = null;
    if (!visibile() || !pronto) { ultimo = 0; return; }
    if (!ultimo) ultimo = ora;
    var dt = Math.min(ora - ultimo, 200);
    ultimo = ora;
    accumulo += dt;
    var giri = 0;
    while (accumulo >= PASSO && giri < 5) { passo(); accumulo -= PASSO; giri++; }
    animaChimico(dt);
    muoviCamera();
    if (ren && scena && camera) ren.render(scena, camera);
    hud();
    anim = requestAnimationFrame(ciclo);
  }

  function avviaCiclo() { if (!anim && pronto) anim = requestAnimationFrame(ciclo); }
  function fermaCiclo() { if (anim) cancelAnimationFrame(anim); anim = null; ultimo = 0; }

  function applicaRisoluzione() {
    if (!ren) return;
    var w = +IMP.risoluzione || 320;
    var h = Math.round(w * 3 / 4);
    ren.setSize(w, h, false);
    if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
  }

  function ricostruisci() {
    if (!scena) return;
    if (mondo && mondo.radice) scena.remove(mondo.radice);
    mondo = costruisciMondo();
  }

  function cominciaPartita() {
    if (!pronto) { avvia3D(function () { if (pronto) cominciaPartita(); }); return; }
    ricostruisci();
    var p = mondo.zona.partenza;
    var st = mondo.zona.stanze.filter(function (x) { return x.id === p.stanza; })[0];
    S.pos.x = st.x + p.x; S.pos.z = st.z + p.z; S.pos.y = 0;
    S.ang = 0; S.angY = 0; S.immune = 0;
    schermo = 'gioco';
    disegnaUI();
    avviaCiclo();
    avviso(mondo.zona.nome, t('cerca gli elementi · ✋ per interagire',
                              'find the elements · ✋ to interact'));
  }

  function avvia3D(cb) {
    cb = cb || function () {};
    if (pronto) { cb(true); return; }
    caricaThree(function (ok) {
      if (!ok || !T) { errore3d = errore3d || 'THREE non disponibile'; cb(false); return; }
      var cont = document.getElementById('bsiAP-scena');
      if (!cont) { cb(false); return; }
      try {
        tela = document.createElement('canvas');
        tela.id = 'bsiAP-tela';
        cont.insertBefore(tela, cont.firstChild);
        ren = new T.WebGLRenderer({ canvas: tela, antialias: false });
        ren.setPixelRatio(1);
        scena = new T.Scene();
        camera = new T.PerspectiveCamera(70, 4 / 3, 0.1, 60);
        materiali();
        /* luce d'ambiente generosa e una direzionale: le ombre dure dei
           poligoni piatti vengono da qui */
        scena.add(new T.HemisphereLight(0xb8ccdf, 0x323c48, 1.45));
        var dir = new T.DirectionalLight(0xffffff, 0.5);
        dir.position.set(0.4, 1, 0.6);
        scena.add(dir);
        chimico = costruisciChimico();
        scena.add(chimico.nodo);
        applicaRisoluzione();
        pronto = true;
        cb(true);
      } catch (e) {
        errore3d = String(e && e.message || e);
        cb(false);
      }
    });
  }

  function tastiera() {
    var mappa = {
      ArrowUp: 'su', w: 'su', W: 'su',
      ArrowDown: 'giu', s: 'giu', S: 'giu',
      ArrowLeft: 'sx', a: 'sx', A: 'sx',
      ArrowRight: 'dx', d: 'dx', D: 'dx',
      q: 'latSx', Q: 'latSx', e: 'latDx', E: 'latDx',
      ' ': 'salto', Shift: 'corsa'
    };
    document.addEventListener('keydown', function (ev) {
      if (!visibile()) return;
      var k = mappa[ev.key];
      if (k) { tasti[k] = true; if (ev.key === ' ' || ev.key.indexOf('Arrow') === 0) ev.preventDefault(); return; }
      if (ev.key === 'f' || ev.key === 'F') { interagisci(); }
      else if (ev.key === 'i' || ev.key === 'I') { schermo = 'inventario'; fermaCiclo(); disegnaUI(); }
      else if (ev.key === 'c' || ev.key === 'C') { schermo = 'codex'; fermaCiclo(); disegnaUI(); }
      else if (ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P') {
        if (schermo === 'gioco') { schermo = 'pausa'; fermaCiclo(); disegnaUI(); }
        else if (schermo === 'pausa') { schermo = 'gioco'; disegnaUI(); avviaCiclo(); }
      } else if (ev.key === 'v' || ev.key === 'V') {
        scriviImp('visuale', IMP.visuale === 'prima' ? 'terza' : 'prima');
        avviso(t('visuale: ', 'view: ') + (IMP.visuale === 'prima'
          ? t('prima persona', 'first person') : t('terza persona', 'third person')));
      }
    });
    document.addEventListener('keyup', function (ev) {
      var k = mappa[ev.key];
      if (k) tasti[k] = false;
    });
    window.addEventListener('blur', function () { tasti = {}; });
  }

  function pulsante() {
    var b = document.querySelector('.nav-btn[data-s="' + ID + '"]');
    if (b) { b.textContent = NOME; return b; }
    var gruppo = document.getElementById('navGroup0');
    if (!gruppo) return null;
    b = document.createElement('button');
    b.className = 'nav-btn';
    b.setAttribute('data-s', ID);
    b.textContent = NOME;
    b.style.cssText = 'border:1px solid #8fe3c4;background:linear-gradient(135deg,' +
      'rgba(143,227,196,.16),rgba(42,74,102,.2))';
    if (gruppo.firstElementChild) gruppo.insertBefore(b, gruppo.firstElementChild.nextSibling);
    else gruppo.appendChild(b);
    return b;
  }

  function applica() {
    leggiImp();
    stile();
    sezione();
    intro();
    pulsante();
    disegnaUI();
    return true;
  }

  function avvia() {
    applica();
    tastiera();
    /* la sezione può essere costruita dopo: si riprova a tratti, come fanno
       gli altri moduli di questo progetto */
    [500, 1500, 3000].forEach(function (ms) { setTimeout(applica, ms); });
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('.nav-btn[data-s="' + ID + '"]');
      if (!b) return;
      setTimeout(function () {
        applica();
        avvia3D(function () {
          disegnaUI();
          if (schermo === 'gioco') avviaCiclo();
        });
      }, 60);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else avvia();

  document.addEventListener('bsi-lingua', function () { intro(); disegnaUI(); });

  globale.BSIAtomic = {
    ID: ID, NOME: NOME, IMP: IMP, DIFFICOLTA: DIFFICOLTA,
    POTERI: POTERI, RICETTE: RICETTE, datiElemento: datiElemento,
    leggiImp: leggiImp, scriviImp: scriviImp, diff: diff,
    nuovaPartita: nuovaPartita, cominciaPartita: cominciaPartita,
    applica: applica, avvia3D: avvia3D, ZONA1: ZONA1,
    stato: function () { return S; },
    schermo: function (x) { if (x) { schermo = x; disegnaUI(); } return schermo; },
    tasti: function (k, giu) { if (k) tasti[k] = !!giu; return tasti; },
    passo: passo, interagisci: interagisci, usaSu: usaSu, sintetizza: sintetizza,
    ricettaPer: ricettaPer, rispondiEnigma: rispondiEnigma, apriEnigma: apriEnigma,
    stanzaDi: function (x, z) { return stanzaDi(x, z); },
    puoStare: function (x, z) { return puoStare(x, z); },
    bersaglio: bersaglio, avviaCiclo: avviaCiclo, fermaCiclo: fermaCiclo,
    pronto: function () { return pronto; }, perche3d: function () { return errore3d; },
    mondo: function () { return mondo; },
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
