/* ═══════════════════════════════════════════════════════════════════════════
   bsi-atomic.js — ATOMIC PROTOCOL
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COS'E'

   Un gioco di esplorazione in tre dimensioni, in terza o in prima persona:
   un chimico attraversa le dieci zone di un istituto sigillato — cento
   livelli, dieci guardiani — raccoglie ELEMENTI, li SINTETIZZA in composti
   e usa la chimica vera per aprire le paratie e abbattere i guardiani.

   TRE MODULI, UNA CASA PER FUNZIONE

     · bsi-atomic-figure.js — il protagonista, i residui e i dieci
       guardiani in qualita' PS2: occhi modellati, mani con le dita,
       texture ad alta risoluzione con le mappe di rilievo, bagliori; i
       guardiani sono le macchine dell'istituto fuori controllo.
     · bsi-atomic-grafica.js — gli ambienti, i materiali e le luci:
       materiali fisici, riflessi d'ambiente, ombre morbide, tone mapping
       cinematografico. Lo stile PS1 resta come scelta retro'.
     · bsi-atomic-livelli.js — i dati: cento livelli generati da un seme,
       guardiani, ricette, enigmi. Niente grafica: il banco li verifica tutti
       senza aprire un fotogramma.
     · questo file — il gioco: movimento, telecamera, interazione,
       combattimento, interfaccia, salvataggio.

   Tutto il progetto sta in `docs/16-Atomic-Protocol-Design.md`.

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
  function LIV() { return globale.BSIAtomicLivelli; }
  function GR() { return globale.BSIAtomicGrafica; }
  function ling() { try { return (L() && L().corrente()) ? L().corrente() : 'it'; } catch (e) { return 'it'; } }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE IMPOSTAZIONI, E DOVE RESTANO

     Si scelgono nel menu e si RICORDANO, una chiave per voce nel deposito
     locale. Ogni lettura e' protetta: in navigazione privata il deposito puo'
     esistere e rifiutare di scrivere.

     La GRAFICA di partenza dipende dal dispositivo: «alta» dove c'e' potenza,
     «media» su un telefono con pochi processori — perche' la prima impressione
     di un gioco che scatta e' peggiore di quella di un gioco meno lucido.
     ═════════════════════════════════════════════════════════════════════════ */
  var PRE = 'bsi-ap-';
  /* la grafica di partenza e' la piu' alta che il dispositivo regge: «alta»
     dove c'e' potenza, «media» su un telefono con pochi processori (stessi
     modelli, senza ombre proiettate). Il PS1 resta come scelta retro' */
  function graficaDiPartenza() {
    try {
      var tocco = globale.matchMedia && globale.matchMedia('(pointer: coarse)').matches;
      var core = (globale.navigator && globale.navigator.hardwareConcurrency) || 8;
      return (tocco && core <= 4) ? 'media' : 'alta';
    } catch (e) { return 'alta'; }
  }
  var IMP = {
    visuale: 'prima',        /* prima | terza: si gioca in prima persona */
    difficolta: 'normale',   /* facile | normale | difficile | esperimento */
    grafica: graficaDiPartenza(), /* alta | media | ps1 */
    risoluzione: '480',      /* solo PS1: 320 | 480 | 640 */
    suono: 'acceso'
  };

  function leggiImp() {
    Object.keys(IMP).forEach(function (k) {
      try {
        var v = globale.localStorage.getItem(PRE + k);
        if (v) IMP[k] = v;
      } catch (e) { /* senza deposito si gioca con i valori di partenza */ }
    });
    if (['alta', 'media', 'ps1'].indexOf(IMP.grafica) < 0) IMP.grafica = 'alta';
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
     GLI ELEMENTI E LE RICETTE

     Il potere e il perche' sono progetto di gioco e stanno nel modulo dei
     livelli; massa, numero atomico, gruppo, periodo, elettronegativita',
     energia di ionizzazione e raggio si leggono da `ELEMENTS`, la tavola
     periodica dell'applicazione. Non si riscrivono 118 elementi in un gioco.
     ═════════════════════════════════════════════════════════════════════════ */
  var POTERI = {}, RICETTE = [];
  function caricaDati() {
    if (!LIV()) return;
    POTERI = LIV().POTERI();
    RICETTE = LIV().RICETTE();
    if (globale.BSIAtomic) { globale.BSIAtomic.POTERI = POTERI; globale.BSIAtomic.RICETTE = RICETTE; }
  }
  function ricetta(id) { return RICETTE.filter(function (r) { return r.id === id; })[0] || null; }

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
     LA TRAMA

     Un appunto nel primo livello di ogni ala, e il finale. Si legge a pezzi,
     e i pezzi tornano solo alla fine: chi ha scritto «riprendere comunque»?
     ═════════════════════════════════════════════════════════════════════════ */
  function TRAMA() {
    return {
      1: t('Verbale del Custode, ore 03:00. «Protocollo 12 ripreso su istruzione archiviata. ' +
           'Contenimento preventivo attivo: tutte le ali sigillate.» In fondo al foglio, a penna: ' +
           '«riprendere comunque». La calligrafia ti sembra familiare. Il tuo badge dice solo: ' +
           'CHIMICO DI TURNO.',
           'Custodian log, 03:00. «Protocol 12 resumed on archived instruction. Preventive ' +
           'containment active: all wings sealed.» At the bottom, in pen: «resume regardless». ' +
           'The handwriting looks familiar. Your badge only says: CHEMIST ON DUTY.'),
      2: t('Diario della dott.ssa Irene Sarti. «Il Protocollo 12 non è una sintesi: è una sintesi ' +
           'che si alimenta da sola. Ogni prodotto catalizza il passo successivo. L’ho fermato tre ' +
           'volte. Il Custode ha l’ordine di non lasciarlo ripartire — e di non lasciare uscire chi ' +
           'lo fa ripartire.»',
           'Diary of Dr Irene Sarti. «Protocol 12 is not a synthesis: it is a synthesis that feeds ' +
           'itself. Each product catalyses the next step. I stopped it three times. The Custodian ' +
           'is ordered not to let it restart — and not to let out whoever restarts it.»'),
      3: t('Registro dello spettrometro. Firma dell’operatore alle 02:51: lo stesso codice del tuo ' +
           'badge. Lo spettro registrato non è di una molecola: è di una catena di radicali che ' +
           'cresce. Qualcuno l’ha avviata dal tuo terminale, venti minuti prima che il Custode ' +
           'chiudesse le ali.',
           'Spectrometer log. Operator signature at 02:51: the same code as your badge. The ' +
           'recorded spectrum is not of a molecule: it is a growing radical chain. Someone ' +
           'started it from your terminal, twenty minutes before the Custodian sealed the wings.'),
      4: t('Nota di Sarti, l’ultima. «Ho nascosto la sequenza di arresto nel campione di DNA: solo ' +
           'chi sa appaiare le basi può leggerla. Se stai leggendo e non ricordi niente, è normale: ' +
           'i vapori del 12 cancellano le ultime ore. Sei tu che l’hai ripreso. Sei anche l’unico ' +
           'che sa come fermarlo.»',
           'Sarti’s last note. «I hid the stop sequence in the DNA sample: only someone who can ' +
           'pair the bases can read it. If you are reading this and remember nothing, that is ' +
           'normal: the vapours of 12 erase the last hours. You restarted it. You are also the ' +
           'only one who knows how to stop it.»'),
      5: t('Registro del quadro elettrico, sotterraneo. Alle 02:40 la corrente delle celle ' +
           'elettrolitiche è stata deviata sul reattore del 12. Autorizzazione: il tuo badge. Sul ' +
           'pannello, un post-it di Sarti: «Il rame cresce anche a corrente spenta. Non toccare ' +
           'le vasche senza guanti.»',
           'Switchboard log, basement. At 02:40 the electrolytic cells’ current was diverted to ' +
           'reactor 12. Authorisation: your badge. On the panel, a sticky note from Sarti: ' +
           '«The copper grows even with the power off. Do not touch the tanks without gloves.»'),
      6: t('Inventario delle celle frigorifere. Campioni del Protocollo 12 conservati a −196 °C. ' +
           'Il più vecchio porta la tua firma e una data di due anni fa. Il Protocollo non è ' +
           'ripartito stanotte per caso: lo stai rifacendo, una volta dopo l’altra, e ogni volta ' +
           'dimentichi.',
           'Cold-room inventory. Protocol 12 samples stored at −196 °C. The oldest bears your ' +
           'signature and a date two years ago. The Protocol did not restart tonight by chance: ' +
           'you keep redoing it, again and again, and each time you forget.'),
      7: t('Fascicolo «P12 — candidato farmaco». Era un sedativo a lunga durata: i finanziatori ' +
           'volevano il farmaco, il sottoprodotto era il problema. Nota a margine di Sarti: «Chi ' +
           'respira i vapori dimentica le ultime ore. È per questo che il direttore non ricorda ' +
           'di aver firmato.»',
           'File «P12 — drug candidate». It was a long-acting sedative: the funders wanted the ' +
           'drug, the by-product was the problem. Sarti’s note in the margin: «Whoever breathes ' +
           'the vapours forgets the last hours. That is why the director does not remember ' +
           'signing.»'),
      8: t('Le telecamere del bunker. Alle 02:51 si vede una persona in camice che sblocca i ' +
           'contenitori delle scorie con la chiave del direttore. Si gira verso l’obiettivo. ' +
           'Hai la tua faccia. Il direttore dell’istituto sei tu.',
           'The bunker cameras. At 02:51 a person in a lab coat unlocks the waste containers ' +
           'with the director’s key. They turn towards the lens. They have your face. The ' +
           'institute’s director is you.'),
      9: t('Ultima registrazione di Sarti, impianto di depurazione: «Il 12 è nelle fogne. Ho ' +
           'chiuso le paratoie a mano, da dentro: se arriva al fiume non si ferma più. Non ' +
           'posso uscire, e va bene così. Finiscilo tu, direttore. Sai come.»',
           'Sarti’s last recording, treatment plant: «12 is in the sewers. I closed the ' +
           'sluices by hand, from inside: if it reaches the river it will never stop. I cannot ' +
           'get out, and that is fine. You finish it, director. You know how.»'),
      10: t('Il Nucleo. Il Custode ti parla per la prima volta: «Non sono il tuo nemico. Ti ho chiuso ' +
           'dentro con lui perché solo tu puoi bilanciarlo. Quando la reazione si ferma, le porte ' +
           'si aprono.» Sul pannello, la tua istruzione scritta a mano: «riprendere comunque». ' +
           'Questa volta la cancelli.',
           'The Core. The Custodian speaks to you for the first time: «I am not your enemy. I ' +
           'locked you in with it because only you can balance it. When the reaction stops, the ' +
           'doors open.» On the panel, your handwritten instruction: «resume regardless». This ' +
           'time you strike it out.'),
      finale: t('Il Protocollo 12 si spegne. Il nucleo si raffredda, l’argon riempie la camera e ' +
           'il silenzio torna nell’istituto. Il Custode apre le ali una a una. Fuori è l’alba. ' +
           'Nel taschino trovi il foglio con la tua calligrafia: lo pieghi e lo lasci sul banco. ' +
           'Qualcuno, domani, dovrà leggere cosa è successo — e capire la chimica che lo ha fermato.',
           'Protocol 12 shuts down. The core cools, argon fills the chamber and silence returns ' +
           'to the institute. The Custodian opens the wings one by one. Outside it is dawn. In ' +
           'your pocket you find the sheet in your handwriting: you fold it and leave it on the ' +
           'bench. Someone, tomorrow, will have to read what happened — and understand the ' +
           'chemistry that stopped it.')
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LO STATO
     ═════════════════════════════════════════════════════════════════════════ */
  var S = null;
  var schermo = 'titolo';     /* titolo · livelli · impostazioni · codex · guida
                                 · gioco · pausa · inventario · sintesi · enigma
                                 · lettura · esito */
  var T = null;               /* THREE */
  var G = null;               /* la grafica costruita */
  var ren = null, scena = null, camera = null, tela = null;
  var pronto = false, errore3d = null;
  var anim = null, ultimo = 0, accumulo = 0;
  var PASSO = 1000 / 60;
  var tasti = {};
  var mondo = null;           /* il livello costruito */
  var chimico = null;         /* il rig del personaggio */
  var mani = null;            /* (non piu' usato: vedi «vista») */
  /* la prima persona: le braccia stanno in una scena loro, con una
     telecamera loro, disegnate dopo il mondo e sopra di esso — cosi' non
     entrano mai nei muri, come in ogni gioco in prima persona */
  var scenaMani = null, camMani = null, vista = null;
  var animV = { rinculo: 0, cambio: 0, prendi: 0, ang: 0, angY: 0, swayX: 0, swayY: 0, terra: true, atterra: 0,
                inMano: undefined, particelle: [] };
  var luci = null;            /* il gruppo di luci che segue il giocatore */
  var audio = null;
  var camLiscia = null;       /* la posizione della telecamera, smorzata */
  var scossa = 0;             /* lo scossone della telecamera quando si viene colpiti */

  function nuovaPartita(livello) {
    var d = diff();
    S = {
      livello: livello || 1, vite: d.vite, vitaMax: d.vite,
      pos: { x: 0, y: 0, z: 0 }, ang: 0, angY: 0,
      vel: { x: 0, y: 0, z: 0 }, terra: true,
      inventario: [],          /* { sim, padronanza, usi } */
      composti: [],            /* { id, dosi } */
      inMano: null,            /* che cosa usa ✦ */
      ricette: RICETTE.map(function (r) { return { id: r.id, sbloccata: !!r.iniziale }; }),
      codex: { elementi: [], molecole: [], reazioni: [], consigli: [], guardiani: [], trama: [], registrazioni: [] },
      fatti: {},               /* quello che è già successo: paratie, guardiani… */
      presi: {},               /* gli oggetti raccolti o abbattuti, per chiave */
      visitate: {},            /* le stanze viste: la mappa le disegna */
      punti: 0, passi: 0, rapide: 0,
      boss: null, finito: null
    };
    return S;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL SALVATAGGIO

     Si salva all'inizio di ogni livello: inventario, composti, ricette,
     codex, punti e il livello raggiunto. Si riprende da li', con le vite
     piene. Il livello piu' alto mai raggiunto resta a parte: e' quello che
     sblocca la scelta dei livelli nel menu.
     ═════════════════════════════════════════════════════════════════════════ */
  function livelloMax() {
    try { return Math.max(1, Math.min(LIV().LIVELLI, +globale.localStorage.getItem(PRE + 'livelloMax') || 1)); }
    catch (e) { return 1; }
  }
  function salva() {
    if (!S) return false;
    var dati = { livello: S.livello, inventario: S.inventario, composti: S.composti,
                 ricette: S.ricette, codex: S.codex, punti: S.punti,
                 difficolta: IMP.difficolta, quando: Date.now() };
    try {
      globale.localStorage.setItem(PRE + 'partita', JSON.stringify(dati));
      if (S.livello > livelloMax()) globale.localStorage.setItem(PRE + 'livelloMax', String(S.livello));
      return true;
    } catch (e) { return false; }
  }
  function salvataggio() {
    try {
      var x = JSON.parse(globale.localStorage.getItem(PRE + 'partita') || 'null');
      return (x && x.livello) ? x : null;
    } catch (e) { return null; }
  }
  function riprendi() {
    var x = salvataggio();
    if (!x) return false;
    nuovaPartita(x.livello);
    S.inventario = x.inventario || [];
    S.composti = x.composti || [];
    S.punti = x.punti || 0;
    if (x.codex) Object.keys(S.codex).forEach(function (k) { if (x.codex[k]) S.codex[k] = x.codex[k]; });
    (x.ricette || []).forEach(function (r) {
      var mia = S.ricette.filter(function (y) { return y.id === r.id; })[0];
      if (mia && r.sbloccata) mia.sbloccata = true;
    });
    return true;
  }

  /* chi comincia da un livello avanzato riceve le ricette che chi ha giocato
     dall'inizio avrebbe gia': quelle delle ali precedenti, i premi dei
     guardiani gia' passati, e quelle che servono al guardiano di questo
     livello — un guardiano invincibile perché manca una scheda e' un gioco
     rotto, non un gioco difficile */
  function ricetteDovute(n) {
    var A = LIV(), dovute = [];
    var zona = Math.ceil(n / LIV().PER_ZONA);
    A.ZONE().forEach(function (z) { if (z.n < zona) dovute = dovute.concat(z.ricette); });
    var G2 = A.GUARDIANI();
    Object.keys(G2).forEach(function (k) {
      var b = G2[k];
      if (+k < n && b.premio) dovute.push(b.premio);
      if (+k <= n) b.fasi.forEach(function (f) {
        var r = ricetta(f.serve);
        if (r) {
          dovute.push(r.id);
          r.reagenti.forEach(function (x) { if (ricetta(x)) dovute.push(x); });
        }
      });
    });
    return dovute;
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
     IL MOTORE
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

  function ps1() { return IMP.grafica === 'ps1'; }

  /* ── il chimico ──────────────────────────────────────────────────────────
     Il modello sta nel modulo grafico; qui si muove. L'animazione e' a
     snodi — spalle, gomiti, anche, ginocchia — perche' un personaggio che
     cammina senza piegare le gambe e' un pupazzo che scivola. */
  var BACINO = 0.95;

  /* LE ANIMAZIONI. Ogni giunto ha un BERSAGLIO calcolato dal passo, e ci
     va per gradi: e' lo smorzamento che toglie la rigidita' da marionetta.
     I versi sono quelli del corpo vero — rotazione positiva dell'anca =
     gamba indietro, ginocchio positivo = piegato (la tibia va indietro),
     gomito negativo = piegato in avanti.

     · il passo e' misurato in metri percorsi: due passi ogni 1,4 m al
       cammino, falcata piu' lunga di corsa, quindi i piedi non scivolano;
     · il ginocchio si piega nella fase in cui la gamba avanza, e appena
       all'appoggio;
     · il bacino sale e scende due volte per ciclo e ruota con le anche, il
       busto ruota al contrario, la testa compensa e resta sull'orizzonte;
     · le falde del camice seguono le cosce in ritardo, piu' aperte di corsa;
     · da fermo si respira, il peso passa da una gamba all'altra, e ogni
       tanto ci si guarda intorno. */
  var anim2 = {};
  function verso(k, bersaglio, a) {
    var v = anim2[k] == null ? bersaglio : anim2[k];
    v += (bersaglio - v) * (a || 0.18);
    anim2[k] = v;
    return v;
  }
  function animaChimico() {
    if (!chimico) return;
    var r = chimico;
    var v = Math.hypot(S.vel.x, S.vel.z);
    var corsa = v > 0.07;
    S.passi += v;
    var f = S.passi * (corsa ? 3.9 : 4.5);
    var amp = Math.min(1, v / 0.05);
    var ora = Date.now() / 1000;
    var B = {};
    if (!S.terra) {
      B = { aSx: -0.9, aDx: 0.35, kSx: 1.3, kDx: 0.5, sSx: -0.5, sDx: -0.4, gSx: -0.9, gDx: -0.9,
            by: BACINO + 0.02, bx: 0, bry: 0, brz: 0, tx: 0.15, ty: 0, cy: 0, fSx: -0.3, fDx: 0.2, cvSx: 0.3, cvDx: 0.2 };
    } else if (v < 0.004) {
      var resp = Math.sin(ora * 1.6);
      var peso = Math.sin(ora * 0.35);
      var guarda = Math.sin(ora * 0.45) * Math.max(0, Math.sin(ora * 0.17)) * 0.5;
      B = { aSx: 0.02, aDx: -0.02, kSx: 0.06 + Math.max(0, peso) * 0.12, kDx: 0.06 + Math.max(0, -peso) * 0.12,
            sSx: 0.06 + resp * 0.015, sDx: 0.06 + resp * 0.015, gSx: -0.18, gDx: -0.22,
            by: BACINO - 0.01 + resp * 0.004 - Math.abs(peso) * 0.01, bx: peso * 0.025, bry: 0, brz: peso * 0.035,
            tx: 0.03 + resp * 0.012, ty: 0, cy: guarda, fSx: 0, fDx: 0, cvSx: 0, cvDx: 0 };
    } else {
      var sn = Math.sin(f), cs = Math.cos(f);
      var A = corsa ? 0.8 : 0.5, K = corsa ? 1.5 : 0.95;
      /* anca: negativa = in avanti. La gamba sinistra avanza quando sin>0 */
      var aSx = -sn * A * amp, aDx = sn * A * amp;
      /* ginocchio: piegato mentre la gamba avanza (derivata dell'anca < 0) */
      var kSx = (0.08 + Math.max(0, cs) * K) * amp + 0.04, kDx = (0.08 + Math.max(0, -cs) * K) * amp + 0.04;
      B = {
        aSx: aSx, aDx: aDx, kSx: kSx, kDx: kDx,
        /* le braccia al contrario delle gambe, i gomiti piu' piegati di corsa */
        sSx: sn * (corsa ? 0.75 : 0.42) * amp, sDx: -sn * (corsa ? 0.75 : 0.42) * amp,
        gSx: corsa ? -1.35 : -0.25 - Math.max(0, -sn) * 0.35, gDx: corsa ? -1.35 : -0.25 - Math.max(0, sn) * 0.35,
        by: BACINO - (corsa ? 0.05 : 0.015) + Math.cos(f * 2) * (corsa ? 0.03 : 0.018) * amp,
        bx: 0, bry: sn * 0.13 * amp, brz: sn * 0.035 * amp,
        tx: (corsa ? 0.24 : 0.06) * amp, ty: -sn * 0.16 * amp, cy: sn * 0.1 * amp,
        fSx: aSx * 0.5 + (corsa ? -0.25 : -0.05), fDx: aDx * 0.5 + (corsa ? -0.25 : -0.05),
        /* la caviglia tiene il piede parallelo al pavimento, e spinge alla fine */
        cvSx: -(aSx + kSx) * 0.6 + Math.max(0, -cs) * 0.25 * amp,
        cvDx: -(aDx + kDx) * 0.6 + Math.max(0, cs) * 0.25 * amp
      };
      /* in curva ci si inclina verso l'interno */
      if (tasti.sx) B.brz -= 0.06; if (tasti.dx) B.brz += 0.06;
    }
    var a = S.terra && v >= 0.004 ? 0.35 : 0.14;
    r.gSx.anca.rotation.x = verso('aSx', B.aSx, a);
    r.gDx.anca.rotation.x = verso('aDx', B.aDx, a);
    r.gSx.ginocchio.rotation.x = verso('kSx', B.kSx, a);
    r.gDx.ginocchio.rotation.x = verso('kDx', B.kDx, a);
    if (r.gSx.caviglia) {
      r.gSx.caviglia.rotation.x = verso('cvSx', B.cvSx, a);
      r.gDx.caviglia.rotation.x = verso('cvDx', B.cvDx, a);
    }
    r.bSx.spalla.rotation.x = verso('sSx', B.sSx, a * 0.8);
    r.bDx.spalla.rotation.x = verso('sDx', B.sDx, a * 0.8);
    r.bSx.spalla.rotation.z = -0.06; r.bDx.spalla.rotation.z = 0.06;
    r.bSx.gomito.rotation.x = verso('gSx', B.gSx, a * 0.7);
    r.bDx.gomito.rotation.x = verso('gDx', B.gDx, a * 0.7);
    r.bacino.position.y = verso('by', B.by, 0.3);
    r.bacino.position.x = verso('bx', B.bx, 0.1);
    r.bacino.rotation.y = verso('bry', B.bry, a);
    r.bacino.rotation.z = verso('brz', B.brz, 0.12);
    r.busto.rotation.x = verso('tx', B.tx, 0.12);
    r.busto.rotation.y = verso('ty', B.ty, a) - r.bacino.rotation.y * 0.5;
    r.busto.rotation.z = -r.bacino.rotation.z * 0.6;
    /* la testa compensa: resta dritta e guarda avanti */
    r.collo.rotation.y = verso('cy', B.cy, 0.08) - r.busto.rotation.y * 0.6 - r.bacino.rotation.y * 0.4;
    r.collo.rotation.x = -r.busto.rotation.x * 0.6;
    if (r.falde) {
      r.falde.sx.rotation.x = verso('fSx', B.fSx, 0.12);
      r.falde.dx.rotation.x = verso('fDx', B.fDx, 0.12);
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     COSTRUIRE IL LIVELLO

     Ogni stanza e' un gruppo con i suoi oggetti dentro, in coordinate della
     stanza. Servono a una cosa sola, ma pesa: si DISEGNANO SOLO la stanza in
     cui si e' e quelle attaccate alle sue porte. Le stanze sono scatole
     chiuse — dalle altre non si vede niente — e un livello di dodici stanze
     costa come una stanza e mezza. Su un telefono e' la differenza fra un
     gioco e una presentazione.
     ═════════════════════════════════════════════════════════════════════════ */
  var COLORI_RESIDUO = [0x5fbf2a, 0x9b4bd9, 0x2ab8bf, 0xbf2a4b, 0xd9772a];
  var COLORI_FUSTO = [0x2f6f9a, 0x3e7a52, 0xd9a627, 0xa8332b, 0x5f656d];
  var SCRITTE_FUSTO = ['HCl 37%', 'NaOH 30%', 'H₂SO₄ 96%', 'ETANOLO', 'ACETONE', 'NH₃ 25%'];

  function vaniPerStanza(st) {
    return function (verso) {
      return (st.porte || []).filter(function (p) { return p.verso === verso; })
        .map(function () { return 0; });
    };
  }

  function solidoRuotato(l, p, ruota) {
    return Math.abs(Math.sin(ruota || 0)) > 0.5 ? { l: p, p: l } : { l: l, p: p };
  }

  function costruisciUscita(o, livello) {
    var g = new T.Group();
    var M = G.M;
    var piatto = new T.Mesh(new T.CylinderGeometry(1.05, 1.1, 0.08, 40), M.acciaioScuro);
    piatto.position.y = 0.04; piatto.receiveShadow = !ps1();
    g.add(piatto);
    var anello = new T.Mesh(new T.TorusGeometry(0.95, 0.035, 10, 60),
      G.mat({ color: 0x0a2a14, emissive: 0x2aff7a, emissiveIntensity: 2.2 }));
    anello.rotation.x = Math.PI / 2; anello.position.y = 0.09;
    g.add(anello);
    /* le due colonne e la trave con il cartello */
    [-1, 1].forEach(function (l) {
      var c = new T.Mesh(G.tonda(0.14, 2.7, 0.14, 0.03), M.strisce);
      c.position.set(l * 1.2, 1.35, 0); c.castShadow = !ps1();
      g.add(c);
    });
    var trave = new T.Mesh(G.tonda(2.6, 0.22, 0.2, 0.03), M.acciaio);
    trave.position.y = 2.75; g.add(trave);
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    var q = cv.getContext('2d');
    q.fillStyle = '#0d2a1a'; q.fillRect(0, 0, 256, 64);
    q.fillStyle = '#7dffb0'; q.font = 'bold 26px sans-serif'; q.textAlign = 'center';
    q.fillText(livello >= LIV().LIVELLI ? t('USCITA', 'EXIT') : t('ASCENSORE ▲', 'ELEVATOR ▲'), 128, 42);
    var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; tx.usaEGetta = true;
    var cart = new T.Mesh(new T.PlaneGeometry(1.4, 0.35),
                          new T.MeshBasicMaterial({ map: tx, toneMapped: false }));
    cart.position.set(0, 2.75, 0.11);
    g.add(cart);
    o._anello = anello;
    return g;
  }

  function costruisciOggetto(o, st, k, zonaN, livello) {
    var g = new T.Group();
    g.position.set(o.x, 0, o.z);
    g.rotation.y = o.ruota || 0;
    o._nodo = g;
    o._stanza = st.id;
    o._chiave = st.id + '#' + k;
    var h = (zonaN * 31 + k * 7 + livello) % 997;
    if (o.tipo === 'scaffale') {
      g.add(G.scaffale());
      o._solido = solidoRuotato(1.5, 0.5, o.ruota);
    } else if (o.tipo === 'fusto') {
      g.add(G.fusto(COLORI_FUSTO[h % COLORI_FUSTO.length], SCRITTE_FUSTO[h % SCRITTE_FUSTO.length]));
      o._solido = { l: 0.7, p: 0.7 };
    } else if (o.tipo === 'fusti') {
      [[-0.34, -0.2], [0.34, -0.2], [0, 0.36]].forEach(function (p, i) {
        var f = G.fusto(COLORI_FUSTO[(h + i) % COLORI_FUSTO.length],
                        SCRITTE_FUSTO[(h + i * 2) % SCRITTE_FUSTO.length]);
        f.position.set(p[0], 0, p[1]); f.rotation.y = i * 1.3;
        g.add(f);
      });
      o._solido = { l: 1.4, p: 1.3 };
    } else if (o.tipo === 'cappa') {
      g.add(G.cappa());
      o._solido = solidoRuotato(1.6, 0.8, o.ruota);
    } else if (o.tipo === 'banco') {
      g.add(G.bancoLab());
      o._solido = solidoRuotato(3.0, 0.9, o.ruota);
    } else if (o.tipo === 'terminale') {
      var te = G.terminale('TERMINALE ' + livello);
      g.add(te.gruppo);
      o._schermo = te.schermo;
      o._solido = { l: 0.9, p: 0.6 };
    } else if (o.tipo === 'elemento') {
      /* la fiala sta su un piedistallo d'acciaio: un reperto, non un sasso */
      var col = (POTERI[o.sim] && POTERI[o.sim].colore) || 0x5eead4;
      var ped = new T.Mesh(G.tonda(0.34, 0.8, 0.34, 0.03), G.M.acciaioScuro);
      ped.position.y = 0.4; ped.castShadow = !ps1(); ped.receiveShadow = !ps1();
      g.add(ped);
      var am = G.ampolla(o.sim, col);
      am.gruppo.position.y = 0.82;
      g.add(am.gruppo);
      o._gira = am.gruppo; o._alone = am.alone; o._dati = datiElemento(o.sim);
      o._solido = { l: 0.36, p: 0.36 };
    } else if (o.tipo === 'foglio') {
      /* l'appunto sta su una cassa: a terra non lo vedrebbe nessuno */
      var cassa = new T.Mesh(G.tonda(0.6, 0.45, 0.45, 0.02), G.M.cartone);
      cassa.position.y = 0.225; cassa.castShadow = !ps1(); cassa.receiveShadow = !ps1();
      g.add(cassa);
      var fo = G.foglio();
      fo.position.y = 0.455; fo.rotation.z = 0.4;
      g.add(fo);
      var spia = new T.Mesh(new T.SphereGeometry(0.05, 10, 10),
        new T.MeshBasicMaterial({ color: o.trama ? 0xffc04d : 0x8fe3c4, toneMapped: false }));
      spia.position.set(0.22, 0.5, 0.15);
      g.add(spia);
      o._gira = spia;
      o._solido = { l: 0.6, p: 0.45 };
    } else if (o.tipo === 'nemico') {
      var r = G.residuo(COLORI_RESIDUO[(zonaN - 1) % COLORI_RESIDUO.length]);
      r.gruppo.position.y = 0.34;
      g.add(r.gruppo);
      o._corpo = r.gruppo; o._deforma = r.deforma;
      o.vivo = true; o.t = (h % 100);
      o.casaX = o.x; o.casaZ = o.z;
    } else if (o.tipo === 'boss') {
      var B = LIV().GUARDIANI()[livello];
      var gu = G.guardiano(B ? B.modello : 'pompa');
      g.add(gu.gruppo);
      o._corpo = gu.gruppo; o._parti = gu.parti; o._def = B;
      o._solido = { l: 2.6, p: 2.2 };
    } else if (o.tipo === 'registratore') {
      var rg = G.registratore();
      g.add(rg.gruppo);
      o._reg = rg;
      o._solido = { l: 0.6, p: 0.45 };
    } else if (o.tipo === 'uscita') {
      g.add(costruisciUscita(o, livello));
    }
    return g;
  }

  function costruisciMondo(n) {
    var A = LIV();
    var liv = A.livello(n);
    var radice = new T.Group();
    var luciMondo = [];
    var paratie = [];
    var alaBreve = liv.zona.nome.split('·')[0].trim();
    liv.stanze.forEach(function (st) {
      st.ala = alaBreve;
      var sg = new T.Group();
      sg.position.set(st.x, 0, st.z);
      var stz = G.stanza(st, vaniPerStanza(st));
      sg.add(stz.gruppo);
      st._g = sg;
      st._emergenza = stz.emergenza;
      st._gocce = stz.gocce || [];
      stz.luci.forEach(function (l) {
        luciMondo.push({ x: st.x + l.x, y: l.y, z: st.z + l.z, stanza: st.id });
      });
      (st.oggetti || []).forEach(function (o, k) {
        var nodo = costruisciOggetto(o, st, k, liv.zona.n, n);
        sg.add(nodo);
        /* quello che e' gia' stato raccolto o abbattuto non torna */
        if (S && S.presi[o._chiave + ':sentito']) o.ascoltato = true;
        if (S && S.presi[o._chiave]) {
          o.preso = true; o.vivo = false; o.abbattuto = true;
          nodo.visible = false;
        }
      });
      /* la paratia chiusa: una sola per coppia di stanze, dal lato sud o est */
      (st.porte || []).forEach(function (p) {
        if (!p.chiusa || (p.verso !== 'sud' && p.verso !== 'est')) return;
        var pa = G.paratia();
        if (p.verso === 'sud') pa.gruppo.position.set(0, 0, st.prof / 2);
        else { pa.gruppo.position.set(st.larg / 2, 0, 0); pa.gruppo.rotation.y = Math.PI / 2; }
        sg.add(pa.gruppo);
        paratie.push({ chiave: p.chiusa, p: pa, apertura: (S && S.fatti[p.chiusa]) ? 1 : 0 });
      });
      radice.add(sg);
    });
    scena.add(radice);
    var nebbia = liv.zona.nebbia;
    if (ps1()) scena.fog = new T.Fog(nebbia, 4, 22);
    else scena.fog = new T.FogExp2(nebbia, 0.055);
    scena.background = new T.Color(nebbia);
    return { zona: liv, livello: liv, ala: liv.zona, radice: radice,
             luci: luciMondo, paratie: paratie, stanzaCorrente: null };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE LUCI

     Il numero di luci in una scena di Three e' scritto negli shader: se
     cambia, ogni materiale si ricompila, e il gioco si pianta per un secondo.
     Quindi le luci sono SEMPRE le stesse — quattro lampade e un faro con
     l'ombra — e si SPOSTANO sulle plafoniere piu' vicine al giocatore,
     preferendo quelle della stanza in cui si trova.
     ═════════════════════════════════════════════════════════════════════════ */
  function creaLuci() {
    var g = { punti: [], faro: null, emi: null, boss: null };
    if (ps1()) {
      /* PS1: poca luce d'ambiente, fredda, e le lampade vicine calde. Le
         stanze di Resident Evil sono buie negli angoli e illuminate a
         chiazze: e' la luce sui vertici a farlo, se le si da' qualcosa da
         illuminare */
      g.emi = new T.HemisphereLight(0x8a98ac, 0x1c2026, 0.8);
      scena.add(g.emi);
      var dir = new T.DirectionalLight(0xffe8d0, 0.28);
      dir.position.set(0.4, 1, 0.6);
      scena.add(dir);
      for (var j = 0; j < 4; j++) {
        var pp = new T.PointLight(0xffe0c0, 0.9, 9);
        pp.position.set(0, -50, 0);
        scena.add(pp);
        g.punti.push(pp);
      }
      g.boss = new T.PointLight(0xff4020, 0, 9);
      scena.add(g.boss);
      return g;
    }
    g.emi = new T.HemisphereLight(0xb8a890, 0x14100c, 0.2);
    scena.add(g.emi);
    for (var i = 0; i < 4; i++) {
      var p = new T.PointLight(0xffe8cc, 0.55, 11);
      p.position.set(0, -50, 0);
      scena.add(p);
      g.punti.push(p);
    }
    var f = new T.SpotLight(0xfff0dc, 1.3, 16, Math.PI / 3.4, 0.55, 1.5);
    f.castShadow = IMP.grafica === 'alta';
    f.shadow.mapSize.set(1024, 1024);
    f.shadow.bias = -0.0004;
    f.shadow.camera.near = 0.3;
    f.shadow.camera.far = 16;
    scena.add(f); scena.add(f.target);
    g.faro = f;
    /* la luce del guardiano: rossa, pulsa quando attacca */
    g.boss = new T.PointLight(0xff4020, 0, 9);
    scena.add(g.boss);
    return g;
  }

  var contaLuci = 0;
  function aggiornaLuci(forza) {
    if (!luci || !mondo || !luci.punti.length) return;
    contaLuci++;
    if (!forza && contaLuci % 12) return;
    var st = stanzaDi(S.pos.x, S.pos.z);
    var id = st ? st.id : null;
    var ord = mondo.luci.slice().sort(function (a, b) {
      var da = Math.hypot(a.x - S.pos.x, a.z - S.pos.z) + (a.stanza === id ? 0 : 40);
      var db = Math.hypot(b.x - S.pos.x, b.z - S.pos.z) + (b.stanza === id ? 0 : 40);
      return da - db;
    });
    var colore = mondo.ala.luce || 0xffe8cc;
    luci.punti.forEach(function (p, i) {
      var l = ord[i];
      if (l) { p.position.set(l.x, l.y, l.z); p.color.setHex(colore); p.intensity = ps1() ? 0.9 : 0.55; }
      else p.intensity = 0;
    });
    if (ord[0] && luci.faro) {
      luci.faro.position.set(ord[0].x, ord[0].y + 0.1, ord[0].z);
      luci.faro.color.setHex(colore);
    }
  }

  /* quali stanze si disegnano: questa e quelle attaccate alle sue porte */
  function aggiornaVisibili() {
    var st = stanzaDi(S.pos.x, S.pos.z);
    if (!st || st === mondo.stanzaCorrente) return;
    mondo.stanzaCorrente = st;
    S.visitate[st.id] = true;
    var vicine = {};
    vicine[st.id] = true;
    (st.porte || []).forEach(function (p) { vicine[p.a] = true; });
    mondo.zona.stanze.forEach(function (x) { if (x._g) x._g.visible = !!vicine[x.id]; });
    aggiornaLuci(true);
  }

  /* ═════════════════════════════════════════════════════════════════════════
     DOVE SI PUO' STARE

     Le collisioni sono a scatole allineate agli assi, e si risolvono per
     assi separati: prima la x, poi la z. Muovendo un asse per volta, chi
     striscia lungo un muro continua a scorrere invece di fermarsi.
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

  /* un vano di porta e' aperto se la porta non e' chiusa a chiave */
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
    if (dz < -P2 + r && !(Math.abs(dx) < 0.9 && portaAperta(st, 'nord'))) return false;
    if (dz > P2 - r && !(Math.abs(dx) < 0.9 && portaAperta(st, 'sud'))) return false;
    if (dx < -L2 + r && !(Math.abs(dz) < 0.9 && portaAperta(st, 'ovest'))) return false;
    if (dx > L2 - r && !(Math.abs(dz) < 0.9 && portaAperta(st, 'est'))) return false;
    var ok = true;
    (st.oggetti || []).forEach(function (o) {
      if (!o._solido || o.preso || o.abbattuto) return;
      if (Math.abs(dx - o.x) < o._solido.l / 2 + r &&
          Math.abs(dz - o.z) < o._solido.p / 2 + r) ok = false;
    });
    return ok;
  }

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

  function vistaLibera(x0, z0, x1, z1) {
    var n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.2);
    for (var i = 1; i <= n; i++) {
      var f = i / n;
      var x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
      if (!liberoIn(x, z) && !neiVani(x, z) && !dentroStanza(x, z)) return false;
    }
    return true;
  }
  /* un punto dentro le mura di una stanza (anche sopra un arredo: la
     telecamera sta in alto) e non nella fascia del muro */
  function dentroStanza(x, z) {
    var st = stanzaDi(x, z);
    if (!st) return false;
    return Math.abs(x - st.x) < st.larg / 2 - 0.4 && Math.abs(z - st.z) < st.prof / 2 - 0.4;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL PASSO DI GIOCO
     ═════════════════════════════════════════════════════════════════════════ */
  var VEL = 0.052, VEL_CORSA = 0.092, GIRO = 0.035;

  function tuttiGliOggetti(fn) {
    mondo.zona.stanze.forEach(function (st) {
      (st.oggetti || []).forEach(function (o) { fn(o, st); });
    });
  }

  function passo() {
    if (!S || schermo !== 'gioco' || !mondo) return;
    var corre = !!tasti.corsa;
    var v = corre ? VEL_CORSA : VEL;

    if (tasti.sx) S.ang += GIRO;
    if (tasti.dx) S.ang -= GIRO;
    if (tasti.guardaSu) S.angY = Math.min(0.6, S.angY + 0.02);
    if (tasti.guardaGiu) S.angY = Math.max(-0.6, S.angY - 0.02);

    var avanti = (tasti.su ? 1 : 0) - (tasti.giu ? 1 : 0);
    var lat = (tasti.latSx ? 1 : 0) - (tasti.latDx ? 1 : 0);
    var dx = (-Math.sin(S.ang) * avanti - Math.cos(S.ang) * lat) * v;
    var dz = (-Math.cos(S.ang) * avanti + Math.sin(S.ang) * lat) * v;

    if (dx && puoStare(S.pos.x + dx, S.pos.z)) S.pos.x += dx;
    if (dz && puoStare(S.pos.x, S.pos.z + dz)) S.pos.z += dz;
    S.vel.x = dx; S.vel.z = dz;

    if (tasti.salto && S.terra) { S.vel.y = 0.19; S.terra = false; bip(380, 0.06); }
    if (!S.terra) {
      S.vel.y -= 0.011;
      S.pos.y += S.vel.y;
      if (S.pos.y <= 0) { S.pos.y = 0; S.vel.y = 0; S.terra = true; }
    }

    var st = stanzaDi(S.pos.x, S.pos.z);
    var ora = Date.now();
    tuttiGliOggetti(function (o, sx) {
      if (o.tipo === 'elemento' && !o.preso) {
        if (sx !== st) return;
        o._gira.rotation.y += 0.02;
        o._gira.position.y = 0.82 + Math.sin(ora / 520 + o.x) * 0.04;
        if (o._alone) o._alone.material.opacity = 0.08 + Math.sin(ora / 300) * 0.04;
      } else if (o.tipo === 'registratore' && o._reg) {
        if (sx !== st) return;
        var suona = nastro && nastro.reg === o.reg;
        o._reg.bobine.forEach(function (bb, i) { if (suona) bb.rotation.y += 0.05 * (i ? 1 : 1.3); });
        var acc = !o.ascoltato && (Math.floor(ora / 500) % 2 === 0);
        o._reg.spia.visible = acc || suona; o._reg.alone.visible = acc || suona;
      } else if (o.tipo === 'foglio' && !o.preso) {
        if (o._gira) o._gira.visible = (Math.floor(ora / 600) % 2) === 0;
      } else if (o.tipo === 'nemico' && o.vivo) {
        o.t++;
        var wx = sx.x + o.x, wz = sx.z + o.z;
        var d = Math.hypot(S.pos.x - wx, S.pos.z - wz) || 1;
        if (d < 7 && sx === st) {
          /* ti viene incontro, piano: è un residuo, non un atleta */
          var ax = (S.pos.x - wx) / d, az = (S.pos.z - wz) / d;
          var nx = o.x + ax * 0.016, nz = o.z + az * 0.016;
          /* e resta nella sua stanza */
          if (Math.abs(nx) < sx.larg / 2 - 0.6) o.x = nx;
          if (Math.abs(nz) < sx.prof / 2 - 0.6) o.z = nz;
          o._nodo.rotation.y = Math.atan2(ax, az);
        }
        o._nodo.position.set(o.x, 0, o.z);
        if (d < 0.85 && !S.immune) danno(t('un residuo corrosivo ti ha toccato',
                                           'a corrosive residue touched you'));
      } else if (o.tipo === 'boss' && !o.abbattuto) {
        passoBoss(o, sx);
      } else if (o.tipo === 'uscita') {
        var aperta = !mondo.livello.boss || S.fatti[mondo.livello.boss.id];
        if (o._anello) {
          o._anello.material.emissive.setHex(aperta ? 0x2aff7a : 0xff3020);
          o._anello.rotation.z += 0.01;
        }
        if (aperta && sx === st && Math.hypot(S.pos.x - (sx.x + o.x), S.pos.z - (sx.z + o.z)) < 0.8) {
          completaLivello();
        }
      }
    });

    /* le paratie scorrono: si aprono, non spariscono */
    mondo.paratie.forEach(function (pa) {
      var obiettivo = S.fatti[pa.chiave] ? 1 : 0;
      pa.apertura += (obiettivo - pa.apertura) * 0.04;
      var w = pa.p.larghezza;
      pa.p.sx.position.x = -w / 4 - pa.apertura * (w / 2 - 0.05);
      pa.p.dx.position.x = w / 4 + pa.apertura * (w / 2 - 0.05);
      pa.p.spia.material = obiettivo ? G.M.ledVerde : G.M.ledRosso;
      /* aperte del tutto, le ante stanno dentro il muro: si nascondono, se
         no i due piani coincidenti sfarfallano */
      pa.p.sx.visible = pa.p.dx.visible = pa.apertura < 0.96;
    });

    if (S.immune > 0) S.immune--;
    S.t = (S.t || 0) + 1;
  }

  function danno(perche) {
    if (S.immune > 0 || S.finito) return;
    S.immune = 60;
    S.vite -= 1;
    scossa = 1;
    bip(140, 0.25, 'sawtooth', 0.08);
    avviso(perche);
    var sc = document.getElementById('bsiAP-scena');
    if (sc) { sc.classList.remove('colpito'); void sc.offsetWidth; sc.classList.add('colpito'); }
    if (S.vite <= 0) {
      S.finito = { esito: 'perso', perche: perche };
      schermo = 'esito';
      fermaCiclo();
      disegnaUI();
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LA TELECAMERA — terza o prima persona, e si cambia subito
     ═════════════════════════════════════════════════════════════════════════ */
  /* ═════════════════════════════════════════════════════════════════════════
     LE BRACCIA IN PRIMA PERSONA

     Quello che separa una prima persona curata da una telecamera che vola
     e' il movimento delle braccia: oscillano col passo (un otto, non un su e
     giu'), restano indietro quando ci si gira e recuperano, respirano da
     fermi, rinculano quando si spruzza, si abbassano e risalgono quando si
     cambia composto, e la sinistra si allunga a prendere e a toccare.
     ═════════════════════════════════════════════════════════════════════════ */
  var BASE_DX = { x: 0.15, y: -0.125, z: -0.33, rx: 0.4, ry: 0.1, rz: 0.05 };
  var BASE_SX = { x: -0.24, y: -0.46, z: -0.3, rx: 0.35, ry: -0.25, rz: -0.1 };
  var TIPO_POTERE = { Na: 'scintille', K: 'scintille', Mg: 'scintille', Fe: 'scintille', Cu: 'scintille', Zn: 'scintille',
                      Al: 'scintille', Ca: 'scintille', Ba: 'scintille', Au: 'scintille', Pb: 'scintille', U: 'scintille',
                      O: 'fiamma', H: 'fiamma', C: 'fiamma', S: 'fiamma', P: 'fiamma',
                      Cl: 'vapore', F: 'vapore', N: 'vapore', Ar: 'vapore' };
  function elementoInMano() { return !!(S && S.inMano && !ricetta(S.inMano)); }
  function aggiornaDispensatore() {
    if (!vista || animV.inMano === S.inMano) return;
    var prima = animV.inMano === undefined;
    animV.inMano = S.inMano;
    if (!prima) animV.cambio = 1;
    var id = S.inMano, r = id ? ricetta(id) : null;
    var col = r ? 0x5ef0c4 : ((POTERI[id] && POTERI[id].colore) || 0x5ef0c4);
    if (r) { var cc = { HCl: 0xbfe8a0, H2O2: 0xdfefff, NaOH: 0xe0e0ff, H2SO4: 0xffe070, NH3: 0xa0d8ff, CO2: 0xd0d8e0,
                        ASC: 0xffd060, NaHCO3: 0xf0f0f0, MgO: 0xffffff, NaCl: 0xf8f8f8, HNO3: 0xffb060, CaO: 0xf0ece0 }[id];
             if (cc) col = cc; }
    var c = r ? S.composti.filter(function (x) { return x.id === id; })[0] : null;
    var testo = r ? r.formula : (id || '');
    var sotto = r ? (c ? '×' + c.dosi : '') : (id ? t('elemento', 'element') : t('vuoto', 'empty'));
    /* il cambio si vede: lo schermo si aggiorna quando lo strumento e' giu' */
    setTimeout(function () {
      if (!vista) return;
      vista.dispensatore.aggiorna(r ? testo : '', r ? sotto : '', col);
      /* un elemento vive sulla mano sinistra; un composto nel dispensatore */
      if (vista.potere) vista.potere.aggiorna(r || !id ? null : (TIPO_POTERE[id] || 'luce'), col);
    }, prima ? 0 : 180);
    animV.colore = col;
  }
  function animaVista() {
    if (!vista) return;
    aggiornaDispensatore();
    var ora = Date.now() / 1000;
    var v = Math.hypot(S.vel.x, S.vel.z), corsa = v > 0.07, amp = Math.min(1, v / 0.05);
    var f = S.passi * (corsa ? 3.9 : 4.5);
    /* il ritardo nelle curve: le braccia seguono lo sguardo con un attimo
       di ritardo, e si inclinano */
    var dAng = S.ang - animV.ang, dAngY = S.angY - animV.angY;
    animV.ang = S.ang; animV.angY = S.angY;
    animV.swayX += (Math.max(-0.08, Math.min(0.08, dAng * 1.6)) - animV.swayX) * 0.12;
    animV.swayY += (Math.max(-0.06, Math.min(0.06, dAngY * 1.2)) - animV.swayY) * 0.12;
    if (!animV.terra && S.terra) animV.atterra = 1;
    animV.terra = S.terra;
    animV.atterra *= 0.86;
    animV.rinculo *= 0.82;
    animV.cambio = Math.max(0, animV.cambio - 0.045);
    animV.prendi = Math.max(0, animV.prendi - 0.03);
    var cambio = Math.sin(Math.min(1, animV.cambio) * Math.PI);
    var resp = Math.sin(ora * 1.7) * 0.004 * (1 - amp);
    var bx = Math.sin(f) * (corsa ? 0.03 : 0.014) * amp;
    var by = -Math.abs(Math.cos(f)) * (corsa ? 0.03 : 0.012) * amp;
    var d = vista.dx;
    d.position.set(BASE_DX.x + bx + animV.swayX * 0.6, BASE_DX.y + by + resp - animV.swayY * 0.5 - animV.atterra * 0.04 - cambio * 0.28 - (corsa ? 0.02 : 0),
                   BASE_DX.z + animV.rinculo * 0.05);
    d.rotation.set(BASE_DX.rx + animV.rinculo * 0.25 + animV.swayY * 0.8 - cambio * 0.6 + (corsa ? -0.15 : 0),
                   BASE_DX.ry + animV.swayX * 1.4 + (corsa ? 0.25 : 0), BASE_DX.rz + bx * 2 + animV.swayX);
    /* la sinistra: di solito appena in vista in basso, si allunga a
       prendere (una curva: avanti, poi indietro) */
    var pr = Math.sin(animV.prendi * Math.PI);
    /* con un elemento in mano la sinistra si alza, col palmo in su, e lo
       tiene vivo; lanciandolo spinge in avanti */
    var vuoleAlta = elementoInMano() ? 1 : 0;
    animV.alta = (animV.alta || 0) + (vuoleAlta - (animV.alta || 0)) * 0.1;
    animV.lancio = Math.max(0, (animV.lancio || 0) - 0.06);
    var al = animV.alta, la = Math.sin(Math.min(1, animV.lancio) * Math.PI);
    var e = vista.sx;
    e.position.set(BASE_SX.x - bx + animV.swayX * 0.6 + pr * 0.16 + al * 0.1 + la * 0.05,
                   BASE_SX.y - by * 0.8 + resp + pr * 0.3 - animV.atterra * 0.04 + al * 0.31 + la * 0.04,
                   BASE_SX.z - pr * 0.2 - al * 0.06 - la * 0.16);
    e.rotation.set(BASE_SX.rx - pr * 0.3 - al * 0.55 - la * 0.3, BASE_SX.ry + animV.swayX * 1.2 + pr * 0.25 + al * 0.35,
                   BASE_SX.rz - bx * 2 + al * 0.15);
    if (vista.manoSx) vista.manoSx.rotation.z = al * Math.PI * 0.82;
    if (vista.potere) vista.potere.anima(ora, al * (1 + la * 1.5));
    /* le goccioline dello spruzzo */
    animV.particelle.forEach(function (q) {
      if (!q.vivo) return;
      q.t += 1;
      q.o.position.addScaledVector(q.v, 1);
      q.v.y -= 0.0006;
      q.o.material.opacity = Math.max(0, 0.55 - q.t / 60);
      q.o.scale.setScalar(0.012 + q.t * 0.0016);
      if (q.t > 40) { q.vivo = false; q.o.visible = false; }
    });
  }
  /* spruzzare: rinculo, e una nuvola di goccioline dal colore del composto */
  function spruzzo() {
    if (!vista) return;
    animV.rinculo = 1;
    var ug = new T.Vector3();
    vista.dispensatore.ugello.getWorldPosition(ug);
    for (var i = 0; i < 18; i++) {
      var q = animV.particelle.filter(function (x) { return !x.vivo; })[0];
      if (!q) {
        if (animV.particelle.length >= 60) break;
        var sp = new T.Sprite(new T.SpriteMaterial({ map: vista.goccia, transparent: true, depthWrite: false,
                                                      blending: T.AdditiveBlending, toneMapped: false }));
        scenaMani.add(sp);
        q = { o: sp, v: new T.Vector3(), t: 0, vivo: false };
        animV.particelle.push(q);
      }
      q.vivo = true; q.t = 0; q.o.visible = true;
      q.o.material.color.setHex(animV.colore || 0x5ef0c4);
      q.o.position.copy(ug);
      q.v.set((Math.random() - 0.5) * 0.004 - 0.002, (Math.random() - 0.3) * 0.003, -0.012 - Math.random() * 0.012);
    }
  }
  function lancio() {
    if (!vista || !vista.potere) return;
    animV.lancio = 1;
    var p0 = new T.Vector3();
    vista.potere.palmo.getWorldPosition(p0);
    for (var i = 0; i < 22; i++) {
      var q = animV.particelle.filter(function (x) { return !x.vivo; })[0];
      if (!q) {
        if (animV.particelle.length >= 70) break;
        var sp = new T.Sprite(new T.SpriteMaterial({ map: vista.goccia, transparent: true, depthWrite: false,
                                                      blending: T.AdditiveBlending, toneMapped: false }));
        scenaMani.add(sp);
        q = { o: sp, v: new T.Vector3(), t: 0, vivo: false };
        animV.particelle.push(q);
      }
      q.vivo = true; q.t = 0; q.o.visible = true;
      q.o.material.color.setHex(animV.colore || 0xffffff);
      q.o.position.copy(p0);
      q.v.set((Math.random() - 0.5) * 0.008 + 0.004, (Math.random() - 0.2) * 0.006, -0.02 - Math.random() * 0.02);
    }
  }
  function creaVista() {
    scenaMani = new T.Scene();
    camMani = new T.PerspectiveCamera(52, camera.aspect, 0.01, 10);
    scenaMani.add(new T.HemisphereLight(0xe4ecf4, 0x3a4048, ps1() ? 1.2 : 0.75));
    var sole = new T.DirectionalLight(0xfff2e0, ps1() ? 0.6 : 1.4);
    sole.position.set(0.6, 1.2, 0.4);
    scenaMani.add(sole);
    var contro = new T.DirectionalLight(0x9fc8ff, ps1() ? 0.2 : 0.5);
    contro.position.set(-0.8, 0.3, -0.6);
    scenaMani.add(contro);
    scenaMani.environment = scena.environment || null;
    vista = G.braccia();
    vista.dx.scale.setScalar(0.72); vista.sx.scale.setScalar(0.72);
    scenaMani.add(vista.gruppo);
    var cv = document.createElement('canvas'); cv.width = cv.height = 32;
    var q = cv.getContext('2d'), gr = q.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = gr; q.fillRect(0, 0, 32, 32);
    vista.goccia = new T.CanvasTexture(cv);
    animV.inMano = undefined; animV.particelle = [];
  }

  function muoviCamera() {
    if (!camera || !S) return;
    var prima = IMP.visuale === 'prima';
    chimico.nodo.position.set(S.pos.x, S.pos.y, S.pos.z);
    /* il modello guarda verso +z, e «avanti» e' -z: senza il mezzo giro il
       chimico avanzava camminando all'indietro, con la faccia verso la
       telecamera */
    chimico.nodo.rotation.y = S.ang + Math.PI;
    /* in prima persona il corpo non si disegna: vedersi il busto da dentro
       la testa e' il modo piu' rapido di rompere l'illusione */
    chimico.nodo.visible = !prima;
    var sx = (Math.random() - 0.5) * scossa * 0.12, sy = (Math.random() - 0.5) * scossa * 0.08;
    scossa *= 0.88;
    if (prima) {
      /* il passo si sente nella testa: su e giu' due volte per ciclo,
         appena di lato, e un piccolo affondo quando si atterra */
      var vv = Math.hypot(S.vel.x, S.vel.z), ampP = Math.min(1, vv / 0.05);
      var fP = S.passi * (vv > 0.07 ? 3.9 : 4.5);
      var bobY = Math.abs(Math.sin(fP)) * 0.03 * ampP - animV.atterra * 0.06;
      var bobX = Math.sin(fP) * 0.012 * ampP;
      camera.position.set(S.pos.x + sx + Math.cos(S.ang) * bobX, S.pos.y + 1.62 + sy + bobY,
                          S.pos.z - Math.sin(S.ang) * bobX);
      camera.rotation.set(S.angY, S.ang, -bobX * 0.6 + (tasti.latSx ? 0.012 : 0) - (tasti.latDx ? 0.012 : 0), 'YXZ');
      animaVista();
    } else {
      var d = 3.7, h = 2.15;
      /* la telecamera non passa i muri: si controlla TUTTO il tragitto dal
         chimico alla telecamera, non solo il punto d'arrivo — in un
         corridoio stretto il punto d'arrivo può stare nella stanza accanto */
      var k = 1;
      while (k > 0.3 && !vistaLibera(S.pos.x, S.pos.z, S.pos.x + Math.sin(S.ang) * d * k,
                                     S.pos.z + Math.cos(S.ang) * d * k)) k -= 0.12;
      var dietroLibero = vistaLibera(S.pos.x, S.pos.z, S.pos.x + Math.sin(S.ang) * d * k,
                                     S.pos.z + Math.cos(S.ang) * d * k);
      /* spalle al muro: la telecamera sale sopra la testa e guarda avanti,
         invece di finire dall'altra parte del muro */
      if (!dietroLibero) { k = 0.05; h = 2.7; }
      var cx = S.pos.x + Math.sin(S.ang) * d * k;
      var cz = S.pos.z + Math.cos(S.ang) * d * k;
      var cy = S.pos.y + h;
      /* la telecamera insegue, non e' incollata: lo smorzamento e' quello
         che separa una ripresa da una telecamera di sorveglianza */
      /* dopo un salto di posizione (un livello nuovo, un caricamento) la
         telecamera non insegue da lontano: si riallinea */
      if (!camLiscia || Math.hypot(camLiscia.x - cx, camLiscia.z - cz) > 6) camLiscia = { x: cx, y: cy, z: cz };
      var a = ps1() ? 1 : 0.14;
      camLiscia.x += (cx - camLiscia.x) * a;
      camLiscia.y += (cy - camLiscia.y) * a;
      camLiscia.z += (cz - camLiscia.z) * a;
      camera.position.set(camLiscia.x + sx, camLiscia.y + sy, camLiscia.z);
      if (dietroLibero) camera.lookAt(S.pos.x, S.pos.y + 1.2 + S.angY * 2, S.pos.z);
      else camera.lookAt(S.pos.x - Math.sin(S.ang) * 2.5, S.pos.y + 0.6, S.pos.z - Math.cos(S.ang) * 2.5);
    }
    if (luci && luci.faro) luci.faro.target.position.set(S.pos.x, 0, S.pos.z);
  }

  /* ═════════════════════════════════════════════════════════════════════════
     INTERAGIRE

     Quello che si puo' toccare e' quello che si ha DAVANTI e VICINO: si
     calcola, non si indovina, e si scrive sullo schermo che cosa succede
     premendo.
     ═════════════════════════════════════════════════════════════════════════ */
  function bersaglio() {
    if (!S || !mondo) return null;
    var st = stanzaDi(S.pos.x, S.pos.z);
    if (!st) return null;
    var mi = null, md = 99;
    (st.oggetti || []).forEach(function (o) {
      if (o.preso || o.abbattuto) return;
      if (['elemento', 'foglio', 'banco', 'terminale', 'uscita', 'registratore'].indexOf(o.tipo) < 0) return;
      if (o.tipo === 'registratore' && o.ascoltato) return;
      var vx = (st.x + o.x) - S.pos.x, vz = (st.z + o.z) - S.pos.z;
      var d = Math.hypot(vx, vz);
      if (o.tipo === 'banco') d -= 0.8;
      if (d >= 2.3) return;
      /* conta anche dove guardi: fra due fiale vicine si prende quella che
         hai davanti, non quella che ti sfiora il gomito */
      var dot = d > 0.05 ? (-Math.sin(S.ang) * vx - Math.cos(S.ang) * vz) / Math.hypot(vx, vz) : 1;
      var peso = d + (1 - dot) * 0.7;
      if (peso < md) { md = peso; mi = o; }
    });
    return mi;
  }

  function prendi(o) {
    o.preso = true;
    if (o._chiave) S.presi[o._chiave] = true;
    if (o._nodo) o._nodo.visible = false;
  }

  function interagisci() {
    if (!S) return;
    animV.prendi = 1;
    /* in una fase-enigma del guardiano, il tasto apre la sfida */
    if (S.boss && S.boss.attivo) {
      var f = faseCorrente(S.boss);
      if (f && /^enigma:/.test(f.serve)) { sfidaBoss(); return; }
    }
    var o = bersaglio();
    if (!o) return;
    if (o.tipo === 'elemento') { prendi(o); prendiElemento(o.sim); }
    else if (o.tipo === 'foglio') { prendi(o); leggiFoglio(o); }
    else if (o.tipo === 'banco') { schermo = 'sintesi'; fermaCiclo(); disegnaUI(); }
    else if (o.tipo === 'terminale') apriEnigma(o);
    else if (o.tipo === 'registratore') { o.ascoltato = true; if (o._chiave) S.presi[o._chiave + ':sentito'] = true; ascolta(o.reg); }
    else if (o.tipo === 'uscita') {
      if (mondo.livello.boss && !S.fatti[mondo.livello.boss.id]) {
        avviso(t('L’ascensore è bloccato finché il guardiano è attivo',
                 'The elevator is locked while the guardian is active'));
      } else completaLivello();
    }
  }

  function prendiElemento(sim) {
    var d = datiElemento(sim);
    var gia = S.inventario.filter(function (x) { return x.sim === sim; })[0];
    if (gia) {
      gia.usi++;
      if (gia.usi % 3 === 0 && gia.padronanza < 5) gia.padronanza++;
    } else S.inventario.push({ sim: sim, padronanza: 1, usi: 0 });
    if (S.codex.elementi.indexOf(sim) < 0) S.codex.elementi.push(sim);
    if (!S.inMano) S.inMano = sim;
    S.punti += 100;
    bip(880, 0.12, 'triangle', 0.07);
    avviso(t('Raccolto ', 'Collected ') + sim + ' · ' + (d.nome || sim) +
           (d.Z ? ' (Z ' + d.Z + ')' : ''),
           POTERI[sim] ? POTERI[sim].potere : '');
  }

  function leggiFoglio(o) {
    bip(520, 0.1, 'triangle', 0.05);
    var testo = '';
    if (o.ricetta) {
      var r = ricetta(o.ricetta);
      sbloccaRicetta(o.ricetta);
      testo = t('Scheda di sintesi, timbrata e piegata in quattro.\n\n',
                'Synthesis card, stamped and folded in four.\n\n') +
              (r ? r.nome + ' — ' + r.formula + '\n' + r.equazione + '\n\n' +
                   t('Reagenti: ', 'Reagents: ') + r.reagenti.join(' + ') + '\n' + r.usa : '');
    } else if (o.trama) {
      testo = TRAMA()[o.trama];
      if (S.codex.trama.indexOf(o.trama) < 0) S.codex.trama.push(o.trama);
    }
    schermo = 'lettura';
    S._lettura = testo;
    fermaCiclo();
    disegnaUI();
  }

  function sbloccaRicetta(id, zitto) {
    var r = S.ricette.filter(function (x) { return x.id === id; })[0];
    if (r && !r.sbloccata) {
      r.sbloccata = true;
      var def = ricetta(id);
      if (!zitto) {
        avviso(t('Ricetta sbloccata: ', 'Recipe unlocked: ') + (def ? def.nome : id),
               def ? def.equazione : '');
        bip(1046, 0.16, 'triangle', 0.07);
      }
      return true;
    }
    return false;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE REGISTRAZIONI — si ascoltano mentre si gioca

     La voce e' quella del dispositivo (la sintesi vocale del browser), con
     un tono e una velocita' per ogni persona: il Custode lento e basso,
     Sarti piu' chiara. I sottotitoli ci sono sempre — anche a suono spento,
     anche dove la voce non c'e' — e il nastro finisce nell'archivio del
     Codex, da riascoltare.
     ═════════════════════════════════════════════════════════════════════════ */
  var nastro = null;
  function ascolta(id) {
    var R = LIV().REGISTRAZIONI()[id - 1];
    if (!R) return;
    var V = LIV().VOCI()[R.voce] || { nome: '', tono: 1, velocita: 1 };
    if (S && S.codex.registrazioni.indexOf(id) < 0) S.codex.registrazioni.push(id);
    taciNastro();
    nastro = { reg: id, inizio: Date.now(), durata: Math.max(4000, R.testo.length * 62) };
    var box = document.getElementById('bsiAP-nastro');
    if (box) {
      box.innerHTML = '<div class="nt"><span class="nt-ico">◉</span><b>' + esc(V.nome) + '</b> · ' + esc(R.titolo) +
        '</div><div class="nt-tx">' + esc(R.testo) + '</div><div class="nt-bar"><i></i></div>';
      box.classList.add('on');
    }
    bip(660, 0.08, 'triangle', 0.04);
    var parla = IMP.suono === 'acceso' && globale.speechSynthesis && globale.SpeechSynthesisUtterance;
    if (parla) {
      try {
        var u = new globale.SpeechSynthesisUtterance(R.testo);
        var lingua = ling() === 'en' ? 'en' : 'it';
        u.lang = lingua === 'en' ? 'en-GB' : 'it-IT';
        var voci = globale.speechSynthesis.getVoices() || [];
        var v = voci.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf(lingua) === 0; })[0];
        if (v) u.voice = v;
        u.pitch = V.tono; u.rate = V.velocita;
        u.onend = function () { if (nastro && nastro.reg === id) nastro.durata = Math.min(nastro.durata, Date.now() - nastro.inizio + 600); };
        globale.speechSynthesis.cancel();
        globale.speechSynthesis.speak(u);
        nastro.voce = true;
      } catch (e) {}
    }
    avviso(t('Registrazione ', 'Recording ') + id + '/30', V.nome);
  }
  function taciNastro() {
    try { if (globale.speechSynthesis) globale.speechSynthesis.cancel(); } catch (e) {}
    nastro = null;
    var box = document.getElementById('bsiAP-nastro');
    if (box) box.classList.remove('on');
  }
  function aggiornaNastro() {
    if (!nastro) return;
    var k = (Date.now() - nastro.inizio) / nastro.durata;
    var bar = document.querySelector('#bsiAP-nastro .nt-bar i');
    if (bar) bar.style.width = Math.min(100, k * 100) + '%';
    if (k >= 1) taciNastro();
  }

  /* ═════════════════════════════════════════════════════════════════════════
     I GUARDIANI

     Ogni guardiano ha delle fasi, e ognuna chiede una cosa di chimica
     diversa: un composto, un elemento, una risposta giusta, o — nell'ultima —
     qualunque cosa, perche' e' scoperto. Non si vince picchiando: si vince
     capendo di che cosa e' fatto. I dati stanno nel modulo dei livelli.
     ═════════════════════════════════════════════════════════════════════════ */
  function faseCorrente(o) {
    return (o && o._def) ? o._def.fasi[(o.fase || 1) - 1] : null;
  }

  function passoBoss(o, st) {
    var B = o._def;
    if (!B) return;
    var wx = st.x + o.x, wz = st.z + o.z;
    if (!o.attivo) {
      var d0 = Math.hypot(S.pos.x - wx, S.pos.z - wz);
      if (d0 < 9 && stanzaDi(S.pos.x, S.pos.z) === st) {
        o.attivo = true; o.fase = 1; o.vita = B.fasi[0].colpi; o.t = 0; o.sbuffo = 0;
        S.boss = o; S.rapide = 0;
        bip(90, 0.5, 'sawtooth', 0.09);
        avviso(B.nome + ' · ' + B.natura, t('debolezza: ', 'weakness: ') + B.fasi[0].descr);
      }
      animaBoss(o, false);
      return;
    }
    o.t++;
    var dx = S.pos.x - wx, dz = S.pos.z - wz;
    var d = Math.hypot(dx, dz) || 1;
    var vel = 0.010 + 0.0015 * (o.fase || 1) + 0.0004 * mondo.livello.n;
    var nx = o.x + (dx / d) * vel, nz = o.z + (dz / d) * vel;
    if (d > 2.4) {
      if (Math.abs(nx) < st.larg / 2 - 2.2) o.x = nx;
      if (Math.abs(nz) < st.prof / 2 - 2.2) o.z = nz;
    }
    o._nodo.position.set(o.x, 0, o.z);
    o._nodo.rotation.y = Math.atan2(dx, dz);
    animaBoss(o, true);
    /* l'attacco: un'onda ogni tanto, piu' fitta con la difficolta' e il
       livello. Si vede arrivare — la luce si accende — e ci si allontana */
    var periodo = Math.max(60, Math.round((125 - mondo.ala.n * 5) / diff().danno));
    if (o.t % periodo === 0) { o.sbuffo = 45; bip(220, 0.3, 'sawtooth', 0.05); }
    if (luci && luci.boss) {
      luci.boss.position.set(wx, 2.2, wz);
      luci.boss.intensity = o.sbuffo > 0 ? 2.2 * (o.sbuffo / 45) : 0.25;
    }
    if (o.sbuffo > 0) {
      o.sbuffo--;
      if (o.sbuffo < 30 && d < 3.4) danno(B.nome + t(' ti ha investito', ' caught you'));
    }
    /* l'ultima finestra si richiude, se non si colpisce in tempo */
    var f = faseCorrente(o);
    if (f && f.serve === 'qualunque') {
      o.finestra = (o.finestra == null ? 900 : o.finestra - 1);
      if (o.finestra <= 0 && o.fase > 1) {
        o.fase--; o.vita = B.fasi[o.fase - 1].colpi; o.finestra = null;
        avviso(t('Si richiude: ', 'It closes again: ') + B.fasi[o.fase - 1].descr);
      }
    }
    /* la luce di emergenza della stanza lampeggia mentre si combatte */
    if (G && G.M.emergenza && G.M.emergenza.emissiveIntensity != null) {
      G.M.emergenza.emissiveIntensity = 1.5 + Math.abs(Math.sin(o.t / 9)) * 3;
    }
  }

  /* le figure dichiarano che cosa gira, dondola, pulsa, trema e brilla:
     qui si anima tutto allo stesso modo, piu' piano finche' il guardiano
     dorme */
  function animaBoss(o, attivo) {
    var p = o._parti || {}, tt = ((o.t || 0) + Date.now() / 16) / 60;
    var rab = attivo ? 1 : 0.3;
    var f = o.fase || 1;
    (p.ruota || []).forEach(function (r) { r.o.rotation[r.asse] += r.v * rab; });
    (p.oscilla || []).forEach(function (r, i) {
      if (r.base == null) r.base = r.o.rotation[r.asse];
      r.o.rotation[r.asse] = r.base + Math.sin(tt * r.f * 3 + i) * r.amp * (attivo ? 1 : 0.5);
    });
    (p.pulsa || []).forEach(function (q, i) {
      var k = 1 + Math.sin(tt * 4 + i * 1.7) * (attivo ? 0.06 : 0.025);
      q.scale.set(k, k * (1 + (k - 1) * 0.5), k);
    });
    (p.tremola || []).forEach(function (q) {
      q.visible = Math.random() > (attivo ? 0.35 : 0.8);
      if (!q.isSprite) q.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    });
    if (p.orbita) {
      p.orbita.o.position.set(Math.cos(tt * 1.4) * p.orbita.r, p.orbita.y + Math.sin(tt * 3) * 0.25,
                              Math.sin(tt * 1.4) * p.orbita.r);
    }
    if (p.galleggia) p.galleggia.position.y = 0.45 + Math.sin(tt * 1.3) * 0.12;
    (p.scorre || []).forEach(function (r, i) {
      if (r.base == null) r.base = r.o.position[r.asse];
      r.o.position[r.asse] = r.base + Math.sin(tt * r.f * 3 + i) * r.amp * (attivo ? 1 : 0.4);
    });
    (p.saliscendi || []).forEach(function (r, i) {
      if (r.base == null) r.base = r.o.position.y;
      r.o.position.y = r.base + Math.sin(tt * r.f * 3 + i * 1.3) * r.amp * (attivo ? 1 : 0.3);
    });
    (p.vapore || []).forEach(function (r) {
      var k = (tt * 0.25 + r.fase) % 1;
      r.o.position.set(r.x + Math.sin(tt + r.fase * 6) * 0.1, r.base + k * 1.2, 0);
      r.o.material.opacity = 0.5 * (1 - k) * (attivo ? 1 : 0.6);
      r.o.scale.setScalar(0.4 + k * 0.9);
    });
    if (p.ruggine) p.ruggine.visible = !attivo || f === 1;
    (p.occhi || []).forEach(function (e) {
      if (e.material && e.material.emissive) {
        e.material.emissiveIntensity = attivo ? (o.sbuffo > 0 ? 3 : (f >= o._def.fasi.length ? 2.4 : 1.5)) : 0.7;
      }
    });
  }

  /* USARE QUALCOSA. Qui sta la regola del gioco: conta CHE COSA usi, non
     quante volte premi. Senza guardiano, quello che hai serve contro i
     residui: sono solvente organico, e un ossidante lo degrada. */
  var OSSIDANTI = ['Cl', 'O', 'F', 'H2O2', 'H2SO4', 'HCl', 'NaOH'];

  function usaSu(id) {
    var o = S.boss;
    if (!o || !o.attivo) return usaSuResiduo(id);
    var B = o._def, f = faseCorrente(o);
    if (/^enigma:/.test(f.serve)) {
      avviso(t('Questa fase non si vince con un reagente: premi ✋ e rispondi',
               'This phase is not won with a reagent: press ✋ and answer'));
      return false;
    }
    var giusto = f.serve === 'qualunque' || id === f.serve;
    if (!giusto) {
      var r = ricetta(id);
      avviso(t('Niente. ', 'Nothing. ') + (r ? r.formula : id) + ' — ' + f.sbagliato);
      bip(150, 0.14, 'square', 0.05);
      return false;
    }
    colpisciBoss(o, f.giusto);
    return true;
  }

  function colpisciBoss(o, perche) {
    var B = o._def;
    bip(620, 0.14, 'triangle', 0.08);
    o.vita--;
    avviso(perche);
    if (o.vita > 0) return;
    S.punti += 300;
    if (o.fase < B.fasi.length) {
      o.fase++;
      o.vita = B.fasi[o.fase - 1].colpi;
      o.finestra = null;
      avviso(t('Fase ', 'Phase ') + o.fase + ' · ' + B.fasi[o.fase - 1].descr, perche);
    } else vinciBoss(o);
  }

  function usaSuResiduo(id) {
    var st = stanzaDi(S.pos.x, S.pos.z);
    var vicino = null, md = 3;
    if (st) (st.oggetti || []).forEach(function (o) {
      if (o.tipo !== 'nemico' || !o.vivo) return;
      var d = Math.hypot(S.pos.x - (st.x + o.x), S.pos.z - (st.z + o.z));
      if (d < md) { md = d; vicino = o; }
    });
    if (!vicino) {
      avviso(t('Non c’è niente su cui usarlo', 'Nothing to use it on'));
      return false;
    }
    if (OSSIDANTI.indexOf(id) < 0) {
      avviso(t('Il residuo è un solvente organico: serve un ossidante (Cl, O, H₂O₂…)',
               'The residue is an organic solvent: you need an oxidiser (Cl, O, H₂O₂…)'));
      bip(150, 0.14, 'square', 0.05);
      return false;
    }
    vicino.vivo = false; vicino.abbattuto = true;
    if (vicino._chiave) S.presi[vicino._chiave] = true;
    vicino._nodo.visible = false;
    S.punti += 50;
    bip(700, 0.12, 'triangle', 0.06);
    var r = ricetta(id);
    avviso(t('Il solvente si ossida e si degrada', 'The solvent oxidises and breaks down'),
           (r ? r.formula : id));
    return true;
  }

  function vinciBoss(o) {
    var B = o._def;
    o.abbattuto = true; o.attivo = false;
    if (o._chiave) S.presi[o._chiave] = true;
    if (o._nodo) o._nodo.visible = false;
    if (luci && luci.boss) luci.boss.intensity = 0;
    if (G && G.M.emergenza) G.M.emergenza.emissiveIntensity = 2.5;
    S.boss = null;
    S.punti += 1000;
    S.fatti[B.id] = true;
    if (B.premio) sbloccaRicetta(B.premio);
    if (S.codex.guardiani.indexOf(B.id) < 0) S.codex.guardiani.push(B.id);
    var cons = B.fasi.filter(function (f) { return f.serve !== 'qualunque'; })
      .map(function (f) { return B.nome + ': ' + f.descr + ' → ' + f.giusto; });
    cons.forEach(function (c) { if (S.codex.consigli.indexOf(c) < 0) S.codex.consigli.push(c); });
    bip(880, 0.3, 'triangle', 0.09);
    if (mondo.livello.n >= LIV().LIVELLI) {
      S.finito = { esito: 'finale' };
      try { globale.localStorage.setItem(PRE + 'finito', '1'); } catch (e) {}
      schermo = 'esito'; fermaCiclo(); disegnaUI();
      return;
    }
    avviso(B.nome + t(' è fermo', ' is down'),
           t('L’ascensore si sblocca', 'The elevator unlocks'));
  }

  /* ═════════════════════════════════════════════════════════════════════════
     FINE LIVELLO
     ═════════════════════════════════════════════════════════════════════════ */
  function completaLivello() {
    if (!S || S.finito) return;
    var n = mondo.livello.n;
    S.punti += 500;
    S.finito = { esito: 'livello', livello: n };
    S.livello = Math.min(LIV().LIVELLI, n + 1);
    salva();
    bip(988, 0.25, 'triangle', 0.08);
    schermo = 'esito';
    fermaCiclo();
    disegnaUI();
  }

  /* ═════════════════════════════════════════════════════════════════════════
     GLI ENIGMI

     Il terminale di ogni livello chiede tre cose, scelte dal programma
     dell'ala: riconoscere un gruppo funzionale DISEGNATO, dare il nome IUPAC
     a una struttura DISEGNATA, costruire una catena, bilanciare una
     reazione, appaiare un filamento di DNA, o una domanda da tutto il resto
     dell'applicazione. Le strutture sono disegnate, non scritte: e' la
     differenza fra chiedere «che cos'e' un alcol» e chiedere «questo che
     cos'e'».
     ═════════════════════════════════════════════════════════════════════════ */
  var orologio = null;

  function apriEnigma(o) {
    if (S.fatti[o.apre]) {
      avviso(t('Il terminale è già sbloccato', 'The terminal is already unlocked'));
      return;
    }
    S.tentativi = (S.tentativi || 0);
    var A = LIV();
    var passi = (o.enigmi || ['riconosci', 'nomina', 'costruisci']).map(function (tp, k) {
      return A.enigma(tp, A.Caso(o.seme + k * 31 + S.tentativi * 977));
    });
    S._enigma = { passi: passi, n: 0, oggetto: o, costruita: [],
                  titolo: t('TERMINALE ', 'TERMINAL ') + mondo.livello.n,
                  tempo: diff().tempo };
    schermo = 'enigma';
    fermaCiclo();
    avviaOrologio();
    disegnaUI();
    bip(520, 0.12, 'triangle', 0.05);
  }

  function sfidaBoss() {
    var o = S.boss, f = faseCorrente(o);
    var tipo = f.serve.split(':')[1];
    var A = LIV();
    S._enigma = { passi: [A.enigma(tipo, A.Caso((o.t || 1) * 7 + o.vita * 13))], n: 0,
                  boss: true, costruita: [], titolo: o._def.nome, tempo: 0 };
    schermo = 'enigma';
    fermaCiclo();
    disegnaUI();
  }

  function avviaOrologio() {
    clearInterval(orologio);
    var E = S && S._enigma;
    if (!E || !E.tempo) return;
    E.resta = E.tempo;
    orologio = setInterval(function () {
      if (!S || !S._enigma || schermo !== 'enigma') { clearInterval(orologio); return; }
      S._enigma.resta--;
      var el = document.getElementById('apTempo');
      if (el) el.textContent = '⏱ ' + S._enigma.resta + ' s';
      if (S._enigma.resta <= 0) {
        clearInterval(orologio);
        S._enigma = null;
        schermo = 'gioco';
        disegnaUI();
        avviaCiclo();
        S.immune = 0;
        danno(t('tempo scaduto al terminale', 'time ran out at the terminal'));
        S.tentativi = (S.tentativi || 0) + 1;
      }
    }, 1000);
  }

  function rispondiEnigma(scelta) {
    var E = S._enigma;
    if (!E) return;
    var p = E.passi[E.n];
    var giusto;
    if (p.tipo === 'costruisci') {
      giusto = E.costruita.join('') === p.catena.join('');
    } else {
      var valore = (typeof scelta === 'number') ? p.opzioni[scelta] : scelta;
      giusto = (valore === p.giusta);
    }
    if (E.boss) {
      S._enigma = null;
      schermo = 'gioco';
      disegnaUI();
      avviaCiclo();
      if (giusto) colpisciBoss(S.boss, faseCorrente(S.boss).giusto);
      else { S.immune = 0; danno(t('No: ', 'No: ') + p.perche); }
      return;
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
    if (p.struttura && S.codex.molecole.indexOf(p.struttura) < 0) S.codex.molecole.push(p.struttura);
    E.n++;
    if (E.n >= E.passi.length) {
      clearInterval(orologio);
      S.fatti[E.oggetto.apre] = true;
      /* il terminale consegna una scheda dell'ala, se ne manca qualcuna */
      var manca = mondo.ala.ricette.filter(function (id) {
        return !S.ricette.filter(function (x) { return x.id === id && x.sbloccata; })[0];
      })[0];
      if (manca) sbloccaRicetta(manca, true);
      schermo = 'gioco';
      S._enigma = null;
      avviaCiclo();
      avviso(t('Paratia sbloccata', 'Bulkhead unlocked'),
             manca ? t('e il terminale ti ha scaricato la scheda di ', 'and the terminal gave you the card for ') +
                     ricetta(manca).formula : t('La strada è aperta', 'The way is open'));
    }
    disegnaUI();
  }

  /* le strutture, disegnate: una sola casa per disegnare una molecola in
     questo gioco. Legge i dati del modulo dei livelli — atomi con le
     coordinate e legami con l'ordine — e disegna come una formula di
     struttura: legami doppi doppi, il gruppo cerchiato se l'enigma lo chiede */
  function disegnaStruttura(cv, p) {
    var q = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    q.clearRect(0, 0, W, H);
    q.strokeStyle = '#eaf6ff'; q.fillStyle = '#eaf6ff';
    q.lineWidth = 2; q.font = 'bold 15px ui-monospace, monospace';
    q.textAlign = 'center'; q.textBaseline = 'middle';
    var cx = W / 2, cy = H / 2 + 8;
    function atomo(x, y, testo, colore) {
      q.fillStyle = '#071018';
      q.beginPath(); q.arc(x, y, 13, 0, 6.2832); q.fill();
      q.fillStyle = colore || '#eaf6ff';
      q.fillText(testo, x, y);
    }
    if (!p) return;
    var S2 = p.struttura && LIV().STRUTTURE[p.struttura];
    if (S2 && S2.atomi) {
      (S2.legami || []).forEach(function (l) {
        var a = S2.atomi[l[0]], b = S2.atomi[l[1]];
        var x1 = cx + a[1], y1 = cy + a[2], x2 = cx + b[1], y2 = cy + b[2];
        q.strokeStyle = '#eaf6ff';
        if (l[2] === 2) {
          var nx = -(y2 - y1), ny = x2 - x1, nn = Math.hypot(nx, ny) || 1;
          nx = nx / nn * 3; ny = ny / nn * 3;
          q.beginPath(); q.moveTo(x1 + nx, y1 + ny); q.lineTo(x2 + nx, y2 + ny); q.stroke();
          q.beginPath(); q.moveTo(x1 - nx, y1 - ny); q.lineTo(x2 - nx, y2 - ny); q.stroke();
        } else { q.beginPath(); q.moveTo(x1, y1); q.lineTo(x2, y2); q.stroke(); }
      });
      S2.atomi.forEach(function (a) {
        var eteroatomo = /O|N|S/.test(a[0]) && !/^C/.test(a[0]) || a[0] === 'O';
        atomo(cx + a[1], cy + a[2], a[0], eteroatomo ? '#7fd4ff' : '#eaf6ff');
      });
      if (p.evidenzia && S2.gruppo != null) {
        var idx = [].concat(S2.gruppo);
        var xs = idx.map(function (i) { return cx + S2.atomi[i][1]; });
        var ys = idx.map(function (i) { return cy + S2.atomi[i][2]; });
        var mx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
        var my = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
        var rx = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) / 2 + 22;
        var ry = (Math.max.apply(null, ys) - Math.min.apply(null, ys)) / 2 + 20;
        q.strokeStyle = '#ffd93d'; q.lineWidth = 2;
        q.beginPath(); q.ellipse(mx, my, rx, ry, 0, 0, 6.2832); q.stroke();
      }
      return;
    }
    if (p.tipo === 'costruisci') {
      var n = p.catena.length, passo2 = Math.min(56, (W - 40) / Math.max(1, n - 1));
      var x0 = cx - passo2 * (n - 1) / 2;
      q.strokeStyle = '#3a4a5e'; q.setLineDash([4, 4]);
      q.beginPath(); q.moveTo(x0, cy); q.lineTo(x0 + passo2 * (n - 1), cy); q.stroke();
      q.setLineDash([]);
      for (var i = 0; i < n; i++) {
        q.strokeStyle = '#3a4a5e';
        q.beginPath(); q.arc(x0 + i * passo2, cy, 13, 0, 6.2832); q.stroke();
      }
      var E = S && S._enigma;
      (E ? E.costruita : []).forEach(function (a, k) { atomo(x0 + k * passo2, cy, a, '#5eead4'); });
      return;
    }
    if (p.equazione) {
      q.font = 'bold 17px ui-monospace, monospace';
      q.fillText(p.equazione, cx, cy - 6);
      return;
    }
    if (p.dna) {
      var COL = { A: '#ff5a5a', T: '#5aa0ff', G: '#5aff8a', C: '#ffd35a' };
      var w = 30, xs0 = cx - w * (p.dna.length - 1) / 2;
      q.font = 'bold 12px ui-monospace, monospace';
      q.fillStyle = '#7f93a8'; q.fillText('5′', xs0 - 26, cy - 14); q.fillText('3′', xs0 + w * (p.dna.length - 1) + 26, cy - 14);
      p.dna.split('').forEach(function (b, k) {
        q.fillStyle = COL[b]; q.fillRect(xs0 + k * w - 11, cy - 26, 22, 22);
        q.fillStyle = '#071018'; q.font = 'bold 14px ui-monospace, monospace';
        q.fillText(b, xs0 + k * w, cy - 15);
        q.strokeStyle = '#3a4a5e'; q.setLineDash([3, 3]);
        q.beginPath(); q.moveTo(xs0 + k * w, cy - 4); q.lineTo(xs0 + k * w, cy + 14); q.stroke();
        q.setLineDash([]);
        q.strokeStyle = '#3a4a5e'; q.strokeRect(xs0 + k * w - 11, cy + 14, 22, 22);
        q.fillStyle = '#3a4a5e'; q.fillText('?', xs0 + k * w, cy + 25);
      });
      return;
    }
    /* domanda dal resto del sito: un'icona, non una struttura inventata */
    q.font = 'bold 34px sans-serif'; q.fillStyle = '#8fe3c4';
    q.fillText('⚗', cx, cy - 6);
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LA SINTESI
     ═════════════════════════════════════════════════════════════════════════ */
  function ricettaPer(scelti) {
    if (!scelti || !scelti.length) return null;
    var chiave = scelti.slice().sort().join('+');
    var r = RICETTE.filter(function (x) {
      return x.reagenti.slice().sort().join('+') === chiave;
    })[0];
    if (!r) return null;
    var sb = S.ricette.filter(function (x) { return x.id === r.id; })[0];
    return (sb && sb.sbloccata) ? r : null;
  }

  function haReagente(id) {
    if (ricetta(id)) {
      var c = S.composti.filter(function (x) { return x.id === id; })[0];
      return !!(c && c.dosi > 0);
    }
    return S.inventario.some(function (x) { return x.sim === id; });
  }

  function sintetizza(r) {
    if (!r) return false;
    if (!r.reagenti.every(haReagente)) {
      avviso(t('Ti manca un reagente', 'You are missing a reagent'));
      return false;
    }
    /* la resa dipende dalla padronanza media degli elementi usati */
    var pad = r.reagenti.map(function (sim) {
      var x = S.inventario.filter(function (y) { return y.sim === sim; })[0];
      return x ? x.padronanza : 3;
    });
    var media = pad.reduce(function (a, b) { return a + b; }, 0) / pad.length;
    var dosi = Math.max(1, Math.round(media));
    /* i composti usati come reagenti si consumano; gli elementi no, e
       l'uso ne fa crescere la padronanza: si impara usando */
    r.reagenti.forEach(function (id) {
      if (ricetta(id)) {
        var c0 = S.composti.filter(function (x) { return x.id === id; })[0];
        c0.dosi--;
        if (c0.dosi <= 0) S.composti.splice(S.composti.indexOf(c0), 1);
        return;
      }
      var x = S.inventario.filter(function (y) { return y.sim === id; })[0];
      if (!x) return;
      x.usi++;
      if (x.usi % 3 === 0 && x.padronanza < 5) x.padronanza++;
    });
    var c = S.composti.filter(function (x) { return x.id === r.id; })[0];
    if (c) c.dosi += dosi; else S.composti.push({ id: r.id, dosi: dosi });
    if (S.codex.reazioni.indexOf(r.equazione) < 0) S.codex.reazioni.push(r.equazione);
    S.inMano = r.id;
    S.punti += 150;
    bip(760, 0.18, 'triangle', 0.07);
    avviso(t('Sintetizzato ', 'Synthesised ') + r.formula + ' ×' + dosi, r.equazione);
    return true;
  }

  /* a «Esperimento» la reazione va bilanciata prima di farla: i coefficienti
     si leggono dall'equazione stessa, cosi' non c'e' un secondo elenco che
     possa sbagliare */
  function coefficienti(eq) {
    var s = String(eq).replace(/\s*\(.*\)\s*$/, '');
    var lati = s.split('→');
    if (lati.length !== 2) return null;
    var termini = lati[0].split(' + ').concat(lati[1].split(' + ')).map(function (x) { return x.trim(); });
    var coeff = termini.map(function (x) { var m = x.match(/^(\d+)\s+/); return m ? +m[1] : 1; });
    var nudi = termini.map(function (x) { return x.replace(/^\d+\s+/, ''); });
    var nSx = lati[0].split(' + ').length;
    var testo = nudi.slice(0, nSx).map(function (x) { return '_ ' + x; }).join(' + ') + ' → ' +
                nudi.slice(nSx).map(function (x) { return '_ ' + x; }).join(' + ');
    return { testo: testo, coeff: coeff };
  }
  function opzioniBilancio(r) {
    var c = coefficienti(r.equazione);
    if (!c) return null;
    var giusta = c.coeff.join(', ');
    var ops = [giusta];
    var k = 0;
    while (ops.length < 4 && k < 40) {
      k++;
      var alt = c.coeff.map(function (x, i) {
        return Math.max(1, x + ((i + k) % c.coeff.length === 0 ? (k % 2 ? 1 : -1) : 0) + (k > 8 ? 1 : 0));
      }).join(', ');
      if (ops.indexOf(alt) < 0) ops.push(alt);
    }
    ops.sort();
    return { testo: c.testo, opzioni: ops, giusta: giusta };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     L'INTERFACCIA

     Tutto quello che si legge e' HTML sopra la scena: i lettori di schermo
     lo vedono, e resta nitido a qualunque risoluzione. La scena e' il gioco;
     l'interfaccia e' interfaccia.
     ═════════════════════════════════════════════════════════════════════════ */
  function stile() {
    if (document.getElementById('bsiAP-stile')) return;
    var s = document.createElement('style');
    s.id = 'bsiAP-stile';
    s.textContent = [
      '#bsiAP-scena{position:relative;margin:0 auto;aspect-ratio:4/3;',
      ' width:min(100%,calc((100dvh - 230px) * 4 / 3));background:#05080c;',
      ' border:1px solid #1e3a52;border-radius:10px;overflow:hidden;',
      ' box-shadow:0 18px 50px rgba(0,0,0,.45)}',
      '#bsiAP-tela{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1}',
      /* in PS1 i pixel restano quadrati: è metà di quello stile */
      '#bsiAP-tela.ps1{image-rendering:pixelated;image-rendering:crisp-edges}',
      /* la vignettatura: l'occhio va al centro, come in un'inquadratura */
      '#bsiAP-scena.reale::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;',
      ' background:radial-gradient(ellipse at 50% 46%,transparent 52%,rgba(0,0,0,.5) 100%)}',
      '#bsiAP-scena.colpito::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;',
      ' box-shadow:inset 0 0 90px rgba(255,30,30,.75);animation:bsiAPcolpo .5s ease-out forwards}',
      '@keyframes bsiAPcolpo{from{opacity:1}to{opacity:0}}',
      '#bsiAP-ui{position:absolute;inset:0;z-index:4;display:flex;',
      ' align-items:center;justify-content:center;padding:12px;box-sizing:border-box;',
      ' pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
      '#bsiAP-ui.attiva{pointer-events:auto;background:rgba(3,7,12,.78);',
      ' backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}',
      '#bsiAP-ui.attiva .bsiAP-scheda{max-height:100%;overflow:auto}',
      '.bsiAP-scheda{max-width:520px;width:100%;color:#dfe9f5;text-align:center}',
      '.bsiAP-tit{font-size:20px;font-weight:800;color:#8fe3c4;letter-spacing:.14em;',
      ' margin:0 0 10px}',
      '.bsiAP-logo{font-size:30px;font-weight:900;letter-spacing:.22em;color:#eaf6ff;',
      ' text-shadow:0 0 18px rgba(143,227,196,.55),0 2px 0 #06202a;margin:4px 0 2px}',
      '.bsiAP-sub{font-size:12.5px;color:#aebccd;line-height:1.6;margin:0 0 12px;white-space:pre-line}',
      '.bsiAP-b{display:block;width:100%;margin:6px 0;padding:11px 14px;',
      ' border-radius:8px;border:1px solid rgba(143,227,196,.28);background:rgba(11,26,38,.82);',
      ' color:#dfe9f5;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;',
      ' letter-spacing:.05em;text-align:left;transition:background .15s,border-color .15s}',
      '.bsiAP-b:hover,.bsiAP-b:focus-visible{border-color:#8fe3c4;background:#12303f;',
      ' outline:none;color:#fff}',
      '.bsiAP-b:disabled{opacity:.45;cursor:default}',
      '.bsiAP-riga{display:flex;gap:6px;align-items:center;justify-content:space-between;',
      ' margin:8px 0;font-size:12.5px;flex-wrap:wrap}',
      '.bsiAP-riga b{color:#8fe3c4;font-weight:700}',
      '.bsiAP-opz{display:flex;gap:4px;flex-wrap:wrap}',
      '.bsiAP-opz button{padding:7px 11px;border-radius:6px;border:1px solid #2a4a66;',
      ' background:#0b1a26;color:#dfe9f5;font-family:inherit;font-size:12px;cursor:pointer;min-height:34px}',
      '.bsiAP-opz button.on{border-color:#8fe3c4;background:#143d4a;color:#fff}',
      '.bsiAP-griglia{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));',
      ' gap:6px;margin:8px 0}',
      '.bsiAP-el{border:1px solid #2a4a66;border-radius:8px;background:rgba(11,26,38,.85);',
      ' padding:8px;cursor:pointer;text-align:left;color:#dfe9f5;font-family:inherit}',
      '.bsiAP-el:hover,.bsiAP-el.on{border-color:#8fe3c4;background:#143d4a}',
      '.bsiAP-el:disabled{opacity:.35;cursor:default}',
      '.bsiAP-el b{display:block;font-size:16px;color:#8fe3c4}',
      '.bsiAP-el span{display:block;font-size:10.5px;color:#9fb0c4}',
      '.bsiAP-barra{height:5px;background:#16293a;border-radius:3px;margin-top:4px}',
      '.bsiAP-barra i{display:block;height:100%;background:#8fe3c4;border-radius:3px}',
      '#bsiAP-hud{position:absolute;inset:0;z-index:3;pointer-events:none;',
      ' font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#dfe9f5;font-size:11.5px}',
      '#bsiAP-hud .alto{position:absolute;top:0;left:0;right:0;display:flex;gap:8px;',
      ' justify-content:space-between;align-items:flex-start;padding:8px 10px;',
      ' background:linear-gradient(rgba(3,7,12,.75),transparent);text-shadow:0 1px 2px #000}',
      '#bsiAP-hud .vite{display:flex;flex-direction:column;gap:5px}',
      '#bsiAP-hud .barra{display:flex;gap:2px;height:10px;width:150px;padding:2px;border-radius:2px;',
      ' background:linear-gradient(180deg,#2a1e0c,#140e06);border:1px solid #c9a24a;',
      ' box-shadow:0 0 0 2px rgba(10,7,3,.7),0 0 0 3px rgba(201,162,74,.5),0 2px 6px rgba(0,0,0,.6)}',
      '#bsiAP-hud .barra.salute i{flex:1;border-radius:1px}',
      '#bsiAP-hud .barra.salute i.p{background:linear-gradient(180deg,#ff6a5a,#a8140e);box-shadow:0 0 6px rgba(255,60,40,.6)}',
      '#bsiAP-hud .barra.salute i.v{background:rgba(120,30,20,.25)}',
      '#bsiAP-hud .barra.reagente{width:120px;height:7px}',
      '#bsiAP-hud .barra.reagente b{display:block;height:100%;border-radius:1px;transition:width .3s;',
      ' background:linear-gradient(180deg,#7ad8ff,#1a6ab8);box-shadow:0 0 6px rgba(80,180,255,.6)}',
      '#bsiAP-hud .dove{font-family:Georgia,"Times New Roman",serif;color:#f0dca0}',
      '#bsiAP-hud .dove small{color:#c9a24a!important;font-variant:small-caps}',
      '#bsiAP-hud .dove{text-align:center;line-height:1.35}',
      '#bsiAP-hud .dove small{display:block;color:#8fe3c4;font-size:10px;letter-spacing:.12em}',
      '#bsiAP-hud .basso{position:absolute;bottom:0;left:0;right:0;padding:8px 10px;',
      ' text-align:center;text-shadow:0 1px 2px #000;',
      ' background:linear-gradient(transparent,rgba(3,7,12,.6))}',
      '#bsiAP-hud .mano{display:inline-block;margin-top:3px;padding:2px 8px;border-radius:10px;',
      ' background:rgba(11,26,38,.75);border:1px solid rgba(143,227,196,.35);color:#cfe2f5}',
      '#bsiAP-hud .boss{position:absolute;top:44px;left:50%;transform:translateX(-50%);',
      ' width:min(70%,360px);text-align:center;color:#ffb0a0;font-weight:700;letter-spacing:.08em}',
      '#bsiAP-hud .boss .bb{height:6px;background:rgba(60,10,10,.8);border:1px solid #ff6b5a;',
      ' border-radius:4px;margin-top:4px;overflow:hidden}',
      '#bsiAP-hud .boss .bb i{display:block;height:100%;background:linear-gradient(90deg,#ff4d3a,#ffb04d)}',
      '#bsiAP-mappa{position:absolute;right:8px;top:40px;width:96px;height:96px;opacity:.85;',
      ' border-radius:8px;background:rgba(3,10,16,.55);border:1px solid rgba(143,227,196,.25)}',
      '#bsiAP-mirino{position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;',
      ' border-radius:50%;background:rgba(255,255,255,.75);box-shadow:0 0 3px #000;transition:all .15s}',
      '#bsiAP-mirino.attivo{width:18px;height:18px;margin:-9px 0 0 -9px;background:transparent;',
      ' border:2px solid #8fe3c4;box-shadow:0 0 6px rgba(143,227,196,.6)}',
      '#bsiAP-avviso{position:absolute;left:50%;transform:translateX(-50%);bottom:58px;',
      ' background:rgba(3,10,16,.86);border:1px solid rgba(143,227,196,.3);border-radius:8px;',
      ' padding:7px 12px;max-width:86%;font-size:12px;line-height:1.5;opacity:0;',
      ' transition:opacity .25s;z-index:5;pointer-events:none;text-align:center;',
      ' font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#dfe9f5}',
      '#bsiAP-avviso.on{opacity:1}',
      '#bsiAP-comandi{display:flex;justify-content:space-between;align-items:flex-end;',
      ' gap:8px;margin-top:8px;user-select:none;-webkit-user-select:none}',
      '.bsiAP-croce{display:grid;grid-template-columns:repeat(3,48px);',
      ' grid-template-rows:repeat(2,48px);gap:5px}',
      '.bsiAP-t{border-radius:10px;border:1px solid #2a4a66;background:rgba(11,26,38,.9);',
      ' color:#cfe2f5;font-size:17px;font-weight:800;cursor:pointer;touch-action:none;',
      ' display:flex;align-items:center;justify-content:center;font-family:inherit;',
      ' width:48px;height:48px}',
      '.bsiAP-t.giu,.bsiAP-t:active{background:#1b4150;border-color:#8fe3c4}',
      '.bsiAP-az{display:grid;grid-template-columns:repeat(3,48px);gap:5px}',
      '.bsiAP-liv{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 10px}',
      '.bsiAP-liv button{padding:9px 4px;border-radius:8px;border:1px solid #2a4a66;',
      ' background:#0b1a26;color:#dfe9f5;font-family:inherit;font-size:12px;cursor:pointer;line-height:1.3}',
      '.bsiAP-liv button.boss{border-color:#a8483a}',
      '.bsiAP-liv button:disabled{opacity:.3;cursor:default}',
      'body.bsiAP-pieno #bsiAP-scena{position:fixed;inset:0;width:100vw;height:100dvh;',
      ' max-width:none;aspect-ratio:auto;border:0;border-radius:0;z-index:9998}',
      'body.bsiAP-pieno #bsiAP-comandi{position:fixed;left:10px;right:10px;',
      ' bottom:max(12px,env(safe-area-inset-bottom));z-index:9999;margin:0}',
      'body.bsiAP-pieno{overflow:hidden}',
      /* i sottotitoli delle registrazioni: una targa d'ottone in basso a sinistra */
      '#bsiAP-nastro{position:absolute;left:12px;bottom:112px;max-width:min(62%,460px);z-index:5;opacity:0;',
      ' transform:translateY(8px);transition:opacity .3s,transform .3s;pointer-events:none;',
      ' background:linear-gradient(180deg,rgba(28,20,10,.92),rgba(12,9,5,.92));border:1px solid #b8913a;',
      ' box-shadow:0 0 0 3px rgba(12,9,5,.7),0 0 0 4px rgba(184,145,58,.45),0 10px 30px rgba(0,0,0,.5);',
      ' border-radius:4px;padding:9px 12px;color:#f2e6c8;font-family:Georgia,"Times New Roman",serif}',
      '#bsiAP-nastro.on{opacity:1;transform:none}',
      '#bsiAP-nastro .nt{font-size:11px;letter-spacing:.06em;color:#d9b96a;margin-bottom:4px}',
      '#bsiAP-nastro .nt b{color:#ffe7a8;font-variant:small-caps;letter-spacing:.08em}',
      '#bsiAP-nastro .nt-ico{color:#ff4a30;margin-right:6px;animation:apRec 1s steps(2) infinite}',
      '@keyframes apRec{50%{opacity:.2}}',
      '#bsiAP-nastro .nt-tx{font-size:13px;line-height:1.45;font-style:italic}',
      '#bsiAP-nastro .nt-bar{height:2px;background:rgba(184,145,58,.25);margin-top:7px}',
      '#bsiAP-nastro .nt-bar i{display:block;height:100%;width:0;background:#d9b96a}',
      /* il pulsante flottante del gioco: pillola come Spectra, ma viola e
         arancio, con l'icona animata */
      '#bsi-gioco-fab{position:fixed;right:20px;bottom:calc(env(safe-area-inset-bottom,0px) + 150px);',
      ' height:48px;padding:0 16px 0 9px;border-radius:24px;display:flex;align-items:center;gap:8px;',
      ' background:linear-gradient(135deg,rgba(30,14,58,.97),rgba(12,30,52,.97));',
      ' border:1.5px solid rgba(180,140,255,.6);cursor:pointer;color:#efe6ff;font-family:inherit;',
      ' z-index:99990;box-shadow:0 6px 22px rgba(140,90,255,.38),0 2px 8px rgba(0,0,0,.45);',
      ' transition:transform .15s,box-shadow .2s,border-color .2s;animation:apFab 4s ease-in-out infinite}',
      '#bsi-gioco-fab:hover{border-color:#ffd34d;box-shadow:0 8px 30px rgba(255,160,60,.45),0 2px 8px rgba(0,0,0,.45)}',
      '#bsi-gioco-fab:active{transform:scale(.94)}',
      '#bsi-gioco-fab:focus-visible{outline:2px solid #ffd34d;outline-offset:3px}',
      '#bsi-gioco-fab .ap-tx{display:flex;flex-direction:column;line-height:1;text-align:left}',
      '#bsi-gioco-fab .ap-tx b{font-size:13.5px;font-weight:900;letter-spacing:.14em;',
      ' background:linear-gradient(90deg,#ffd34d,#ff8a3d);-webkit-background-clip:text;background-clip:text;color:transparent}',
      '#bsi-gioco-fab .ap-tx small{font-size:8.5px;font-weight:800;letter-spacing:.3em;color:#b8a6e8;margin-top:3px}',
      '@keyframes apFab{0%,100%{box-shadow:0 6px 22px rgba(140,90,255,.32),0 2px 8px rgba(0,0,0,.45)}',
      ' 50%{box-shadow:0 6px 30px rgba(255,150,60,.42),0 2px 8px rgba(0,0,0,.45)}}',
      '@media (prefers-reduced-motion:reduce){#bsi-gioco-fab{animation:none}}',
      '@media (max-width:360px){#bsi-gioco-fab{padding:0 9px}#bsi-gioco-fab .ap-tx{display:none}}',
      'body.bsiAP-sezione #bsi-gioco-fab,body.bsiAP-sezione #bsi14-fab,body.bsiAP-sezione #bsi-spectra-fab',
      '{visibility:hidden!important;pointer-events:none!important}'
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
        '<div id="bsiAP-nastro" aria-live="polite"></div>' +
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
      '<b>Esplorazione in tre dimensioni, cento livelli in dieci zone, dieci guardiani.</b> Sei un ' +
      'chimico chiuso dentro un istituto sigillato: cammini, apri paratie, raccogli ' +
      '<b>elementi</b>, li <b>sintetizzi</b> in composti al banco e usi la chimica vera per ' +
      'fermare le macchine dell’istituto andate fuori controllo. Grafica di livello <b>PlayStation 2</b> — ' +
      'materiali fisici, ombre, riflessi, bagliori — e lo stile PS1 come scelta retrò. Visuale in <b>terza o ' +
      'prima persona</b>; quattro difficoltà, fino all’«Esperimento», dove le reazioni vanno ' +
      'bilanciate. Il gioco <b>si salva</b> a ogni livello e funziona <b>offline</b>.',
      '<b>Three-dimensional exploration, a hundred levels in ten zones, ten guardians.</b> You are a ' +
      'chemist locked inside a sealed institute: you walk, open bulkheads, collect ' +
      '<b>elements</b>, <b>synthesise</b> them into compounds at the bench and use real ' +
      'chemistry to stop the institute’s runaway machines. <b>PlayStation 2</b>-level graphics — ' +
      'physical materials, shadows, reflections, glow — and PS1 style as a retro option. ' +
      '<b>Third or first person</b> view; four difficulties, up to «Experiment», where ' +
      'reactions must be balanced. The game <b>saves</b> at every level and works <b>offline</b>.');
  }

  var tAvviso = null;
  function avviso(testo, extra) {
    var a = document.getElementById('bsiAP-avviso');
    if (!a) return;
    a.innerHTML = esc(testo) + (extra ? '<br><span style="color:#8fe3c4">' +
                                        esc(extra) + '</span>' : '');
    a.classList.add('on');
    clearTimeout(tAvviso);
    tAvviso = setTimeout(function () { a.classList.remove('on'); }, 3000);
  }

  function ui() { return document.getElementById('bsiAP-ui'); }

  function nomeInMano() {
    if (!S || !S.inMano) return '';
    var r = ricetta(S.inMano);
    if (r) {
      var c = S.composti.filter(function (x) { return x.id === S.inMano; })[0];
      return r.formula + (c ? ' ×' + c.dosi : '');
    }
    return S.inMano;
  }

  /* il quadro si costruisce una volta e poi si aggiornano solo i testi che
     cambiano: riscrivere l'HTML sessanta volte al secondo e' il modo piu'
     rapido per far scattare un gioco su un telefono */
  var hudPrec = {};
  function hud() {
    var h = document.getElementById('bsiAP-hud');
    if (!h) return;
    if (schermo !== 'gioco' || !S || !mondo) {
      if (h.innerHTML) { h.innerHTML = ''; hudPrec = {}; }
      return;
    }
    if (!document.getElementById('bsiAP-mappa')) {
      h.innerHTML = '<div class="alto"><span class="vite" id="apH-vite"></span>' +
        '<span class="dove" id="apH-dove"></span><span id="apH-punti"></span></div>' +
        '<div class="boss" id="apH-boss"></div>' +
        '<canvas id="bsiAP-mappa" width="192" height="192"></canvas>' +
        '<div id="bsiAP-mirino"></div>' +
        '<div class="basso" id="apH-basso"></div>';
      hudPrec = {};
    }
    var st = stanzaDi(S.pos.x, S.pos.z);
    var b = bersaglio();
    var azione = '';
    if (b) {
      azione = b.tipo === 'elemento' ? t('✋ raccogli ', '✋ take ') + b.sim
             : b.tipo === 'foglio' ? t('✋ leggi', '✋ read')
             : b.tipo === 'banco' ? t('✋ laboratorio di sintesi', '✋ synthesis lab')
             : b.tipo === 'uscita' ? t('✋ ascensore', '✋ elevator')
             : b.tipo === 'registratore' ? t('✋ ascolta la registrazione', '✋ play the recording')
             : t('✋ usa il terminale', '✋ use the terminal');
    }
    var f = S.boss && S.boss.attivo ? faseCorrente(S.boss) : null;
    if (f && /^enigma:/.test(f.serve)) azione = t('✋ rispondi alla sfida', '✋ answer the challenge');
    var parti = {
      /* le barre in stile déco: la salute (rossa, a tacche, una per vita) e
         il reagente in mano (blu: le dosi del composto, piena per un
         elemento, che non si consuma) */
      vite: (function () {
        var tacche = '';
        for (var i = 0; i < S.vitaMax; i++) tacche += '<i class="' + (i < S.vite ? 'p' : 'v') + '"></i>';
        var r = S.inMano ? ricetta(S.inMano) : null, dosi = 0;
        if (r) { var c = S.composti.filter(function (x) { return x.id === S.inMano; })[0]; dosi = c ? Math.min(1, c.dosi / 9) : 0; }
        else if (S.inMano) dosi = 1;
        return '<span class="barra salute" role="img" aria-label="' + t('salute ', 'health ') + S.vite + '/' + S.vitaMax + '">' + tacche + '</span>' +
               '<span class="barra reagente" role="img" aria-label="' + t('reagente', 'reagent') + '"><b style="width:' +
               Math.round(dosi * 100) + '%"></b></span>';
      })(),
      dove: '<small>' + esc(t('LIVELLO ', 'LEVEL ') + mondo.livello.n + ' · ' +
            String(mondo.ala.nome).split('·')[0]) + '</small>' + esc(st ? st.nome : ''),
      punti: String(S.punti).padStart(6, '0'),
      boss: f ? esc(S.boss._def.nome) + ' · ' + t('fase ', 'phase ') + S.boss.fase + '/' +
                S.boss._def.fasi.length + ' — ' + esc(f.descr) +
                '<div class="bb"><i style="width:' + Math.round(100 * S.boss.vita / f.colpi) + '%"></i></div>' : '',
      basso: (azione ? '<b style="color:#8fe3c4">' + azione + '</b><br>' : '') +
             (S.inMano ? '<span class="mano">✦ ' + esc(nomeInMano()) + '</span>' : '')
    };
    Object.keys(parti).forEach(function (k) {
      if (hudPrec[k] !== parti[k]) {
        var el = document.getElementById('apH-' + k);
        if (el) el.innerHTML = parti[k];
        hudPrec[k] = parti[k];
      }
    });
    var mir = document.getElementById('bsiAP-mirino');
    if (mir) {
      mir.style.display = IMP.visuale === 'prima' ? 'block' : 'none';
      mir.className = b ? 'attivo' : '';
    }
    if ((S.t || 0) % 10 === 0) mappa();
    aggiornaNastro();
  }

  /* la mappa: solo le stanze gia' viste, come su un taccuino */
  function mappa() {
    var cv = document.getElementById('bsiAP-mappa');
    if (!cv || !mondo) return;
    var q = cv.getContext('2d');
    var st = mondo.zona.stanze;
    var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    st.forEach(function (s) {
      minX = Math.min(minX, s.x - s.larg / 2); maxX = Math.max(maxX, s.x + s.larg / 2);
      minZ = Math.min(minZ, s.z - s.prof / 2); maxZ = Math.max(maxZ, s.z + s.prof / 2);
    });
    var sc = 176 / Math.max(maxX - minX, maxZ - minZ);
    var ox = 8 + (176 - (maxX - minX) * sc) / 2, oz = 8 + (176 - (maxZ - minZ) * sc) / 2;
    q.clearRect(0, 0, 192, 192);
    var qui = stanzaDi(S.pos.x, S.pos.z);
    st.forEach(function (s) {
      if (!S.visitate[s.id]) return;
      var x = ox + (s.x - s.larg / 2 - minX) * sc, z = oz + (s.z - s.prof / 2 - minZ) * sc;
      q.fillStyle = s === qui ? 'rgba(143,227,196,.38)' : 'rgba(143,227,196,.14)';
      q.fillRect(x + 1, z + 1, s.larg * sc - 2, s.prof * sc - 2);
      q.strokeStyle = 'rgba(143,227,196,.6)'; q.lineWidth = 1.5;
      q.strokeRect(x + 1, z + 1, s.larg * sc - 2, s.prof * sc - 2);
      (s.oggetti || []).forEach(function (o) {
        if (o.preso || o.abbattuto) return;
        var col = o.tipo === 'uscita' ? '#2aff7a' : o.tipo === 'boss' ? '#ff4d3a'
                : o.tipo === 'elemento' ? '#ffd24a' : o.tipo === 'terminale' ? '#5ef0c4' : null;
        if (!col) return;
        q.fillStyle = col;
        q.beginPath(); q.arc(ox + (s.x + o.x - minX) * sc, oz + (s.z + o.z - minZ) * sc, 3.5, 0, 6.2832); q.fill();
      });
    });
    var px = ox + (S.pos.x - minX) * sc, pz = oz + (S.pos.z - minZ) * sc;
    q.save(); q.translate(px, pz); q.rotate(-S.ang);
    q.fillStyle = '#ffffff';
    q.beginPath(); q.moveTo(0, -7); q.lineTo(5, 5); q.lineTo(-5, 5); q.closePath(); q.fill();
    q.restore();
  }

  function bottone(id, testo, dis) {
    return '<button class="bsiAP-b" id="' + id + '"' + (dis ? ' disabled' : '') + '>' + testo + '</button>';
  }
  function su(id, fn) { var b = document.getElementById(id); if (b) b.onclick = fn; }
  function torna() { schermo = 'gioco'; disegnaUI(); avviaCiclo(); }

  function disegnaUI() {
    stile();
    var u = ui();
    if (!u) return;
    var sc = document.getElementById('bsiAP-scena');
    if (sc) sc.classList.toggle('reale', !ps1());
    hud();
    u.className = (schermo === 'gioco') ? '' : 'attiva';
    if (schermo === 'gioco') { u.innerHTML = ''; comandi(); return; }

    if (schermo === 'titolo') {
      var sv = salvataggio();
      u.innerHTML = '<div class="bsiAP-scheda">' +
        '<div class="bsiAP-logo">' + NOME + '</div>' +
        '<div class="bsiAP-sub">' +
          t('— protocollo di contenimento · ', '— containment protocol · ') + LIV().LIVELLI + t(' livelli —', ' levels —') + '</div>' +
        (sv ? bottone('apRiprendi', '▸ ' + t('CONTINUA', 'CONTINUE') + ' · ' +
                      t('livello ', 'level ') + sv.livello) : '') +
        bottone('apNuova', (sv ? '◇ ' : '▸ ') + t('NUOVA PARTITA', 'NEW GAME')) +
        bottone('apLivelli', '▦ ' + t('SCEGLI LIVELLO', 'SELECT LEVEL') + ' (' + livelloMax() + '/' + LIV().LIVELLI + ')') +
        bottone('apImp', '⚙ ' + t('IMPOSTAZIONI', 'SETTINGS')) +
        bottone('apGuida', '❔ ' + t('COME SI GIOCA', 'HOW TO PLAY')) +
        bottone('apCodex', '📖 CODEX') +
        '<div class="bsiAP-sub" style="margin-top:10px;font-size:11px">' +
          t('visuale ', 'view ') + '<b>' + (IMP.visuale === 'prima' ? t('prima persona', 'first person')
                                   : t('terza persona', 'third person')) +
          '</b> · ' + t('difficoltà ', 'difficulty ') + '<b>' + diff().nome +
          '</b> · ' + t('grafica ', 'graphics ') + '<b>' + nomeGrafica(IMP.grafica) + '</b></div></div>';
      su('apRiprendi', function () { if (riprendi()) cominciaPartita(); });
      su('apNuova', function () { nuovaPartita(1); cominciaPartita(); });
      su('apLivelli', function () { schermo = 'livelli'; disegnaUI(); });
      su('apImp', function () { schermo = 'impostazioni'; disegnaUI(); });
      su('apGuida', function () { schermo = 'guida'; disegnaUI(); });
      su('apCodex', function () { schermo = 'codex'; disegnaUI(); });
      return;
    }

    if (schermo === 'livelli') {
      var max = livelloMax(), Gd = LIV().GUARDIANI();
      var h = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">▦ ' + t('LIVELLI', 'LEVELS') + '</div>';
      LIV().ZONE().forEach(function (z) {
        h += '<div class="bsiAP-sub" style="margin:6px 0 0"><b style="color:#8fe3c4">' +
             esc(z.nome) + '</b></div><div class="bsiAP-liv">';
        var PZ = LIV().PER_ZONA;
        for (var n = (z.n - 1) * PZ + 1; n <= z.n * PZ; n++) {
          var b2 = Gd[n];
          h += '<button data-liv="' + n + '"' + (b2 ? ' class="boss"' : '') +
               (n > max ? ' disabled' : '') + '>' + (n > max ? '🔒 ' : '') + n +
               (b2 ? '<br><small>☠ ' + esc(b2.nome) + '</small>' : '') + '</button>';
        }
        h += '</div>';
      });
      h += bottone('apIndietroL', '◂ ' + t('indietro', 'back')) + '</div>';
      u.innerHTML = h;
      [].forEach.call(u.querySelectorAll('[data-liv]'), function (b3) {
        b3.onclick = function () {
          var n2 = +b3.getAttribute('data-liv');
          var sv2 = salvataggio();
          /* si tengono elementi e composti gia' guadagnati, se ci sono */
          if (sv2 && riprendi()) S.livello = n2; else nuovaPartita(n2);
          cominciaPartita();
        };
      });
      su('apIndietroL', function () { schermo = 'titolo'; disegnaUI(); });
      return;
    }

    if (schermo === 'impostazioni') {
      var gruppo = function (etichetta, chiave, valori) {
        var h2 = '<div class="bsiAP-riga"><b>' + etichetta + '</b><span class="bsiAP-opz">';
        valori.forEach(function (v) {
          h2 += '<button data-k="' + chiave + '" data-v="' + v[0] + '"' +
               (IMP[chiave] === v[0] ? ' class="on"' : '') + '>' + v[1] + '</button>';
        });
        return h2 + '</span></div>';
      };
      var lingue = '<div class="bsiAP-riga"><b>' + t('Lingua', 'Language') +
        '</b><span class="bsiAP-opz"><button data-lingua="it"' + (ling() === 'it' ? ' class="on"' : '') +
        '>Italiano</button><button data-lingua="en"' + (ling() === 'en' ? ' class="on"' : '') +
        '>English</button></span></div>';
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">⚙ ' + t('IMPOSTAZIONI', 'SETTINGS') + '</div>' +
        gruppo(t('Visuale', 'View'), 'visuale',
               [['terza', t('terza persona', 'third person')],
                ['prima', t('prima persona', 'first person')]]) +
        gruppo(t('Difficoltà', 'Difficulty'), 'difficolta',
               [['facile', DIFFICOLTA.facile.nome], ['normale', DIFFICOLTA.normale.nome],
                ['difficile', DIFFICOLTA.difficile.nome],
                ['esperimento', DIFFICOLTA.esperimento.nome]]) +
        gruppo(t('Grafica', 'Graphics'), 'grafica',
               [['alta', nomeGrafica('alta')], ['media', nomeGrafica('media')],
                ['ps1', nomeGrafica('ps1')]]) +
        (ps1() ? gruppo(t('Risoluzione PS1', 'PS1 resolution'), 'risoluzione',
               [['320', '320×240'], ['480', '480×360'], ['640', '640×480']]) : '') +
        gruppo(t('Suono', 'Sound'), 'suono',
               [['acceso', t('acceso', 'on')], ['spento', t('spento', 'off')]]) +
        lingue +
        '<div class="bsiAP-sub" style="margin-top:10px">' +
          t('Alta: livello PS2 — materiali fisici, ombre morbide, riflessi, bagliori, texture ad alta ' +
            'risoluzione. Media: stessi modelli senza ombre proiettate, per i telefoni. PS1: lo stile ' +
            'retrò, con pochi poligoni, luce sui vertici e colore a 15 bit.\n' +
            'La difficoltà cambia vite, danno, tempo degli enigmi e se la sintesi rapida è ' +
            'permessa. A «Esperimento» le reazioni vanno bilanciate.',
            'High: PS2 level — physical materials, soft shadows, reflections, glow, high-resolution ' +
            'textures. Medium: same models without cast shadows, for phones. PS1: the retro style, ' +
            'with few polygons, vertex lighting and 15-bit colour.\n' +
            'Difficulty changes lives, damage, puzzle time and whether quick synthesis is ' +
            'allowed. On «Experiment» reactions must be balanced.') +
        '</div>' + bottone('apIndietro', '◂ ' + t('indietro', 'back')) + '</div>';
      [].forEach.call(u.querySelectorAll('[data-k]'), function (b4) {
        b4.onclick = function () {
          var k = b4.getAttribute('data-k'), v = b4.getAttribute('data-v');
          var cambia = IMP[k] !== v;
          scriviImp(k, v);
          if (k === 'risoluzione') applicaRisoluzione();
          if (k === 'grafica' && cambia) rifai3D();
          if (k === 'difficolta') { DIFFICOLTA = ricreaDifficolta(); }
          disegnaUI();
          bip(660, 0.05, 'square', 0.04);
        };
      });
      [].forEach.call(u.querySelectorAll('[data-lingua]'), function (b5) {
        b5.onclick = function () {
          try { if (L() && L().imposta) L().imposta(b5.getAttribute('data-lingua')); } catch (e) {}
          caricaDati(); DIFFICOLTA = ricreaDifficolta();
          intro(); disegnaUI();
        };
      });
      su('apIndietro', function () { schermo = (S && mondo && !S.finito) ? 'pausa' : 'titolo'; disegnaUI(); });
      return;
    }

    if (schermo === 'guida') {
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">❔ ' + t('COME SI GIOCA', 'HOW TO PLAY') + '</div>' +
        '<div class="bsiAP-sub">' + esc(t(
          'OBIETTIVO — in ogni livello trova il terminale, risolvi l’enigma per aprire la ' +
          'paratia e raggiungi l’ascensore. Alla fine di ogni zona, ogni dieci livelli, un guardiano blocca la strada: una macchina dell’istituto fuori controllo.\n\n' +
          'ELEMENTI — le fiale sui piedistalli. Raccolti, restano tuoi: usarli fa crescere la ' +
          'padronanza, e la padronanza aumenta la resa della sintesi.\n\n' +
          'SINTESI — al banco scegli i reagenti: se conosci la ricetta (schede, terminali, ' +
          'guardiani) ottieni il composto. Alcuni composti si fanno da altri composti.\n\n' +
          'GUARDIANI — ogni fase ha una debolezza chimica scritta in alto. Usa la cosa giusta con ✦; ' +
          'quella sbagliata non fa niente. Alcune fasi si vincono rispondendo (✋). Allontanati ' +
          'quando la luce rossa si accende.\n\n' +
          'RESIDUI — chiazze di solvente organico che si spostano e fumano: un ossidante (Cl, O, H₂O₂…) le degrada.\n\n' +
          'COMANDI — si gioca in prima persona. Computer: clicca sulla scena e il mouse muove lo sguardo (Esc lo libera); W/S avanti e indietro, A/D di lato, frecce per girare, Maiusc corre, ' +
          'Spazio salta, F interagisce, X usa ✦, R cambia quello che hai in mano, I inventario, ' +
          'C codex, V passa alla terza persona, Esc pausa. Telefono: trascina il dito sulla scena per guardarti intorno, e i pulsanti sotto la scena.',
          'GOAL — on each level find the terminal, solve the puzzle to open the bulkhead and ' +
          'reach the elevator. At the end of every zone, every ten levels, a guardian blocks the way: one of the institute’s machines out of control.\n\n' +
          'ELEMENTS — the vials on the pedestals. Once collected they are yours: using them ' +
          'raises mastery, and mastery increases synthesis yield.\n\n' +
          'SYNTHESIS — at the bench pick the reagents: if you know the recipe (cards, ' +
          'terminals, guardians) you get the compound. Some compounds are made from others.\n\n' +
          'GUARDIANS — each phase has a chemical weakness shown at the top. Use the right thing ' +
          'with ✦; the wrong one does nothing. Some phases are won by answering (✋). Step back ' +
          'when the red light flares.\n\n' +
          'RESIDUES — moving, fuming puddles of organic solvent: an oxidiser (Cl, O, H₂O₂…) degrades them.\n\n' +
          'CONTROLS — you play in first person. Computer: click the scene and the mouse moves your gaze (Esc frees it); W/S forward and back, A/D strafe, arrows turn, Shift runs, ' +
          'Space jumps, F interacts, X uses ✦, R switches what you hold, I inventory, C codex, ' +
          'V switches to third person, Esc pause. Phone: drag a finger on the scene to look around, and the buttons below the scene.')) + '</div>' +
        bottone('apIndietroG', '◂ ' + t('indietro', 'back')) + '</div>';
      su('apIndietroG', function () { schermo = (S && mondo && !S.finito) ? 'pausa' : 'titolo'; disegnaUI(); });
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
          (aperta ? esc(r.nome) + ' · ' + esc(r.classe) : t('non ancora trovata', 'not found yet')) +
          '</span><span style="color:#7f93a8">' + (aperta ? esc(r.equazione) : '') + '</span></div>';
      }).join('');
      var Gd2 = LIV().GUARDIANI();
      var gua = (S ? S.codex.guardiani : []).map(function (id) {
        var b6 = Object.keys(Gd2).map(function (k) { return Gd2[k]; })
          .filter(function (x) { return x.id === id; })[0];
        return b6 ? '<div class="bsiAP-el" style="cursor:default"><b>' + esc(b6.nome) +
          '</b><span>' + esc(b6.natura) + '</span></div>' : '';
      }).join('');
      var tr = (S ? S.codex.trama : []).map(function (k) {
        return '<div class="bsiAP-sub" style="text-align:left;border-left:2px solid #8fe3c4;' +
               'padding-left:8px">' + esc(TRAMA()[k]) + '</div>';
      }).join('');
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">📖 CODEX</div>' +
        '<div class="bsiAP-sub">' + t('Elementi', 'Elements') + '</div>' +
        '<div class="bsiAP-griglia">' + (el || '<span class="bsiAP-sub">' +
          t('nessuno, ancora', 'none yet') + '</span>') + '</div>' +
        '<div class="bsiAP-sub">' + t('Sintesi', 'Synthesis') + '</div>' +
        '<div class="bsiAP-griglia">' + ric + '</div>' +
        (gua ? '<div class="bsiAP-sub">' + t('Guardiani fermati', 'Guardians stopped') +
               '</div><div class="bsiAP-griglia">' + gua + '</div>' : '') +
        ((S && S.codex.consigli.length) ? '<div class="bsiAP-sub">' +
          t('Consigli', 'Tips') + '</div><div class="bsiAP-sub" style="text-align:left">• ' +
          S.codex.consigli.map(esc).join('<br>• ') + '</div>' : '') +
        (tr ? '<div class="bsiAP-sub">' + t('Appunti ritrovati', 'Notes found') + '</div>' + tr : '') +
        (function () {
          var regs = (S ? S.codex.registrazioni || [] : []).slice().sort(function (a2, b2) { return a2 - b2; });
          if (!regs.length) return '';
          var RR = LIV().REGISTRAZIONI(), VV = LIV().VOCI();
          return '<div class="bsiAP-sub">' + t('Registrazioni ', 'Recordings ') + regs.length + '/30</div>' +
            regs.map(function (id) {
              var r = RR[id - 1], v = VV[r.voce] || {};
              return '<button class="bsiAP-b" data-nastro="' + id + '" style="font-weight:600">▶ ' + id + '. ' +
                esc(r.titolo) + ' <span style="color:#9fb0c4;font-weight:400">— ' + esc(v.nome || '') + '</span></button>';
            }).join('');
        })() +
        bottone('apIndietro2', '◂ ' + t('indietro', 'back')) + '</div>';
      [].forEach.call(u.querySelectorAll('[data-nastro]'), function (bn) {
        bn.onclick = function () { ascolta(+bn.getAttribute('data-nastro')); };
      });
      su('apIndietro2', function () { schermo = (S && mondo && !S.finito) ? 'pausa' : 'titolo'; disegnaUI(); });
      return;
    }

    if (schermo === 'lettura') {
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">📄 ' + t('APPUNTO', 'NOTE') + '</div>' +
        '<div class="bsiAP-sub" style="font-size:13.5px;color:#d8e4f0">' + esc(S._lettura || '') + '</div>' +
        bottone('apChiudi', t('chiudi', 'close')) + '</div>';
      su('apChiudi', torna);
      return;
    }

    if (schermo === 'inventario') {
      var inv = S.inventario.map(function (x) {
        var d = datiElemento(x.sim), p = POTERI[x.sim] || {};
        return '<button class="bsiAP-el' + (S.inMano === x.sim ? ' on' : '') + '" data-sim="' + x.sim + '"><b>' + x.sim + '</b>' +
          '<span>' + esc(d.nome || '') + (d.Z ? ' · Z ' + d.Z : '') + '</span>' +
          '<span>' + esc(p.potere || '') + '</span>' +
          '<div class="bsiAP-barra"><i style="width:' + (x.padronanza * 20) + '%"></i></div>' +
          '<span style="color:#7f93a8">' + t('padronanza ', 'mastery ') +
          x.padronanza + '/5</span></button>';
      }).join('');
      var comp = S.composti.map(function (c) {
        var r = ricetta(c.id);
        return '<button class="bsiAP-el' + (S.inMano === c.id ? ' on' : '') + '" data-comp="' + c.id + '"><b>' +
          (r ? r.formula : c.id) + ' ×' + c.dosi + '</b><span>' + esc(r ? r.nome : '') +
          '</span><span style="color:#7f93a8">' + esc(r ? r.classe : '') + '</span></button>';
      }).join('');
      var rapide = S.boss && S.boss.attivo && S.rapide < diff().sintesiRapida;
      u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
        '<div class="bsiAP-tit">🎒 ' + t('INVENTARIO', 'INVENTORY') + '</div>' +
        '<div class="bsiAP-sub">' + t('Tocca qualcosa per prenderlo in mano (✦)',
                                      'Tap something to hold it (✦)') + '</div>' +
        '<div class="bsiAP-griglia">' + (inv || '<span class="bsiAP-sub">' +
          t('nessun elemento: cerca le fiale nelle stanze',
            'no elements: look for the vials in the rooms') + '</span>') + '</div>' +
        (comp ? '<div class="bsiAP-sub">' + t('Composti', 'Compounds') + '</div>' +
                '<div class="bsiAP-griglia">' + comp + '</div>' : '') +
        '<div class="bsiAP-sub" id="apDettaglio"></div>' +
        (S.boss && S.boss.attivo ? bottone('apRapida', '⚗ ' + t('sintesi rapida', 'quick synthesis') +
          ' (' + Math.max(0, diff().sintesiRapida - S.rapide) + ')', !rapide) : '') +
        bottone('apChiudiInv', t('chiudi', 'close')) + '</div>';
      [].forEach.call(u.querySelectorAll('[data-sim]'), function (b7) {
        b7.onclick = function () {
          var sim = b7.getAttribute('data-sim');
          S.inMano = sim;
          var d = datiElemento(sim), p = POTERI[sim] || {};
          [].forEach.call(u.querySelectorAll('.bsiAP-el'), function (x) { x.classList.remove('on'); });
          b7.classList.add('on');
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
      [].forEach.call(u.querySelectorAll('[data-comp]'), function (b8) {
        b8.onclick = function () {
          var id = b8.getAttribute('data-comp'), r = ricetta(id);
          S.inMano = id;
          [].forEach.call(u.querySelectorAll('.bsiAP-el'), function (x) { x.classList.remove('on'); });
          b8.classList.add('on');
          document.getElementById('apDettaglio').innerHTML = r ? '<b style="color:#8fe3c4">' +
            r.formula + ' · ' + esc(r.nome) + '</b><br>' + esc(r.equazione) + '<br>' + esc(r.usa) : '';
        };
      });
      su('apRapida', function () { S.rapide++; schermo = 'sintesi'; disegnaUI(); });
      su('apChiudiInv', torna);
      return;
    }

    if (schermo === 'sintesi') { schermoSintesi(u); return; }
    if (schermo === 'enigma') { schermoEnigma(u); return; }

    if (schermo === 'pausa') {
      u.innerHTML = '<div class="bsiAP-scheda">' +
        '<div class="bsiAP-tit">❚❚ ' + t('IN PAUSA', 'PAUSED') + '</div>' +
        '<div class="bsiAP-sub">' + t('Livello ', 'Level ') + mondo.livello.n + ' · ' +
          esc(diff().nome) + ' · ♥ ' + S.vite + ' · ' + S.punti + t(' punti', ' points') + '</div>' +
        bottone('apRiprendiP', '▸ ' + t('riprendi', 'resume')) +
        bottone('apInv', '🎒 ' + t('inventario', 'inventory')) +
        bottone('apCod', '📖 codex') +
        bottone('apGuidaP', '❔ ' + t('come si gioca', 'how to play')) +
        bottone('apImp2', '⚙ ' + t('impostazioni e lingua', 'settings and language')) +
        bottone('apRicomincia', '↺ ' + t('ricomincia il livello', 'restart the level')) +
        bottone('apEsci', '⏏ ' + t('esci al titolo', 'quit to title')) + '</div>';
      su('apRiprendiP', torna);
      su('apInv', function () { schermo = 'inventario'; disegnaUI(); });
      su('apCod', function () { schermo = 'codex'; disegnaUI(); });
      su('apGuidaP', function () { schermo = 'guida'; disegnaUI(); });
      su('apImp2', function () { schermo = 'impostazioni'; disegnaUI(); });
      su('apRicomincia', function () {
        var n = mondo.livello.n;
        if (!riprendi()) nuovaPartita(n);
        S.livello = n;
        cominciaPartita();
      });
      su('apEsci', function () { S = null; mondo && scena && scena.remove(mondo.radice); mondo = null; schermo = 'titolo'; disegnaUI(); });
      return;
    }

    if (schermo === 'esito') {
      var F = S.finito || {};
      var titolo, testo, bott;
      if (F.esito === 'livello') {
        titolo = t('LIVELLO ', 'LEVEL ') + F.livello + t(' COMPLETATO', ' COMPLETE');
        var prossimo = LIV().livello(S.livello);
        testo = t('Salvato. Prossimo: ', 'Saved. Next: ') + prossimo.nome +
                (prossimo.boss ? '\n☠ ' + t('ti aspetta ', 'awaiting you: ') + prossimo.boss.nome : '') +
                '\n' + S.punti + t(' punti', ' points');
        bott = bottone('apAvanti', '▸ ' + t('livello ', 'level ') + S.livello) +
               bottone('apTitolo', t('torna al titolo', 'back to title'));
      } else if (F.esito === 'finale') {
        titolo = t('PROTOCOLLO 12 FERMATO', 'PROTOCOL 12 STOPPED');
        testo = TRAMA().finale + '\n\n' + S.punti + t(' punti', ' points') + ' · ' + diff().nome;
        bott = bottone('apTitolo', t('torna al titolo', 'back to title'));
      } else {
        titolo = t('CONTENIMENTO FALLITO', 'CONTAINMENT FAILED');
        testo = (F.perche || '') + '\n' + S.punti + t(' punti', ' points');
        bott = bottone('apAncora', '↺ ' + t('riprova il livello', 'retry the level')) +
               bottone('apTitolo', t('torna al titolo', 'back to title'));
      }
      u.innerHTML = '<div class="bsiAP-scheda"><div class="bsiAP-tit">' + titolo +
        '</div><div class="bsiAP-sub">' + esc(testo) + '</div>' + bott + '</div>';
      su('apAvanti', function () {
        var n = S.livello;
        riprendi(); S.livello = n;
        cominciaPartita();
      });
      su('apAncora', function () {
        var n = mondo ? mondo.livello.n : 1;
        if (!riprendi() || salvataggio().livello !== n) nuovaPartita(n);
        S.livello = n;
        cominciaPartita();
      });
      su('apTitolo', function () { S = null; schermo = 'titolo'; disegnaUI(); });
      return;
    }
  }

  function nomeGrafica(g) {
    return g === 'alta' ? t('alta (PS2)', 'high (PS2)')
         : g === 'media' ? t('media', 'medium') : t('PS1 retrò', 'PS1 retro');
  }
  function ricreaDifficolta() {
    return {
      facile:      { nome: t('Facile', 'Easy'), vite: 5, danno: 0.6, tempo: 0, sintesiRapida: 99, suggerimento: 'subito' },
      normale:     { nome: t('Normale', 'Normal'), vite: 3, danno: 1, tempo: 0, sintesiRapida: 99, suggerimento: 'dopo' },
      difficile:   { nome: t('Difficile', 'Hard'), vite: 2, danno: 1.4, tempo: 90, sintesiRapida: 2, suggerimento: 'mai' },
      esperimento: { nome: t('Esperimento', 'Experiment'), vite: 1, danno: 2, tempo: 45, sintesiRapida: 0, suggerimento: 'mai' }
    };
  }

  /* ── il laboratorio di sintesi ───────────────────────────────────────── */
  var selezione = [];
  var bilancio = null;

  function schermoSintesi(u) {
    var inv = S.inventario.map(function (x) {
      return '<button class="bsiAP-el' + (selezione.indexOf(x.sim) >= 0 ? ' on' : '') +
        '" data-sim="' + x.sim + '"><b>' + x.sim + '</b><span>' +
        t('padronanza ', 'mastery ') + x.padronanza + '/5</span></button>';
    }).join('');
    var comp = S.composti.map(function (c) {
      var r = ricetta(c.id);
      return '<button class="bsiAP-el' + (selezione.indexOf(c.id) >= 0 ? ' on' : '') +
        '" data-sim="' + c.id + '"><b>' + (r ? r.formula : c.id) + '</b><span>×' + c.dosi + '</span></button>';
    }).join('');
    var trovata = ricettaPer(selezione);
    var note = S.ricette.filter(function (x) { return x.sbloccata; }).length;
    var esperimento = IMP.difficolta === 'esperimento';
    if (trovata && esperimento && (!bilancio || bilancio.id !== trovata.id)) {
      bilancio = opzioniBilancio(trovata); if (bilancio) { bilancio.id = trovata.id; bilancio.scelta = null; }
    }
    var bilanciata = !esperimento || !bilancio || bilancio.scelta === bilancio.giusta;
    var formula = function (id) { var r = ricetta(id); return r ? r.formula : id; };
    u.innerHTML = '<div class="bsiAP-scheda" style="text-align:left">' +
      '<div class="bsiAP-tit">⚗ ' + t('LABORATORIO DI SINTESI', 'SYNTHESIS LAB') + '</div>' +
      '<div class="bsiAP-sub">' + t('Scegli i reagenti (fino a quattro):', 'Pick the reagents (up to four):') + '</div>' +
      '<div class="bsiAP-griglia">' + (inv || '<span class="bsiAP-sub">' +
        t('non hai elementi', 'you have no elements') + '</span>') + comp + '</div>' +
      '<div class="bsiAP-sub" style="min-height:40px">' +
        (selezione.length ? '<b>' + selezione.map(formula).join(' + ') + '</b> → ' +
          (trovata ? '<b style="color:#8fe3c4">' + trovata.formula + '</b> · ' +
            esc(trovata.nome) + '<br><span style="color:#7f93a8">' +
            (esperimento && bilancio && !bilanciata ? esc(bilancio.testo) : esc(trovata.equazione)) +
            ' · ' + esc(trovata.usa) + '</span>'
            : t('niente di noto: o non reagiscono così, o la ricetta non la conosci ancora',
                'nothing known: either they do not react that way, or you do not know the recipe yet'))
          : t('nessun reagente scelto', 'no reagent selected')) + '</div>' +
      (trovata && esperimento && bilancio && !bilanciata ?
        '<div class="bsiAP-sub">' + t('Esperimento: scegli i coefficienti che bilanciano la reazione',
                                      'Experiment: pick the coefficients that balance the reaction') +
        '</div><div class="bsiAP-opz">' + bilancio.opzioni.map(function (o) {
          return '<button data-coeff="' + esc(o) + '">' + esc(o) + '</button>';
        }).join('') + '</div>' : '') +
      bottone('apFai', t('SINTETIZZA', 'SYNTHESISE'), !(trovata && bilanciata)) +
      '<div class="bsiAP-sub">' + t('Ricette conosciute: ', 'Known recipes: ') +
        note + '/' + RICETTE.length + '</div>' +
      bottone('apChiudiSin', t('chiudi', 'close')) + '</div>';
    [].forEach.call(u.querySelectorAll('[data-sim]'), function (b) {
      b.onclick = function () {
        var sim = b.getAttribute('data-sim');
        var k = selezione.indexOf(sim);
        if (k >= 0) selezione.splice(k, 1);
        else if (selezione.length < 4) selezione.push(sim);
        bip(560, 0.04, 'square', 0.04);
        disegnaUI();
      };
    });
    [].forEach.call(u.querySelectorAll('[data-coeff]'), function (b) {
      b.onclick = function () {
        bilancio.scelta = b.getAttribute('data-coeff');
        if (bilancio.scelta !== bilancio.giusta) {
          bip(150, 0.14, 'square', 0.05);
          avviso(t('Gli atomi non tornano: conta ogni elemento a destra e a sinistra',
                   'The atoms do not add up: count each element on both sides'));
        }
        disegnaUI();
      };
    });
    su('apFai', function () {
      var r = ricettaPer(selezione);
      if (!r) return;
      sintetizza(r);
      selezione = []; bilancio = null;
      disegnaUI();
    });
    su('apChiudiSin', function () { selezione = []; bilancio = null; torna(); });
  }

  /* ── l'enigma ────────────────────────────────────────────────────────── */
  function schermoEnigma(u) {
    var E = S._enigma;
    if (!E) { schermo = 'gioco'; return; }
    var p = E.passi[E.n];
    var h = '<div class="bsiAP-scheda" style="text-align:left">' +
      '<div class="bsiAP-tit">🖥 ' + esc(E.titolo) +
      (E.passi.length > 1 ? ' · ' + (E.n + 1) + '/' + E.passi.length : '') +
      (E.tempo ? ' <span id="apTempo" style="color:#ffb04d;font-size:13px">⏱ ' +
                 (E.resta != null ? E.resta : E.tempo) + ' s</span>' : '') + '</div>' +
      '<canvas id="apStruttura" width="340" height="120" ' +
        'style="width:100%;max-width:340px;display:block;margin:0 auto 8px;' +
        'background:#071018;border:1px solid #2a4a66;border-radius:8px"></canvas>' +
      '<div class="bsiAP-sub">' + esc(p.testo) + (p.area ? ' <span style="color:#7f93a8">· ' +
        esc(p.area) + '</span>' : '') + '</div>';
    if (p.tipo === 'costruisci') {
      h += '<div class="bsiAP-opz" style="justify-content:center">' +
        p.scelte.map(function (a) {
          return '<button data-atomo="' + a + '">' + a + '</button>';
        }).join('') + '</div>' +
        bottone('apVerifica', t('verifica', 'check')) + bottone('apPulisci', t('cancella', 'clear'));
    } else {
      p.opzioni.forEach(function (o, k) {
        h += '<button class="bsiAP-b" data-op="' + k + '">' + esc(o) + '</button>';
      });
    }
    if (E.messaggio) h += '<div class="bsiAP-sub" style="color:#8fe3c4">' + esc(E.messaggio) + '</div>';
    if (!E.boss) h += bottone('apAllontanati', t('allontanati', 'step away'));
    h += '</div>';
    u.innerHTML = h;
    var cv = document.getElementById('apStruttura');
    if (cv) disegnaStruttura(cv, p);
    [].forEach.call(u.querySelectorAll('[data-op]'), function (b) {
      b.onclick = function () { rispondiEnigma(+b.getAttribute('data-op')); };
    });
    [].forEach.call(u.querySelectorAll('[data-atomo]'), function (b) {
      b.onclick = function () {
        if (E.costruita.length < p.catena.length) E.costruita.push(b.getAttribute('data-atomo'));
        bip(600, 0.04, 'square', 0.04);
        disegnaUI();
      };
    });
    su('apVerifica', function () { rispondiEnigma(null); });
    su('apPulisci', function () { E.costruita = []; disegnaUI(); });
    su('apAllontanati', function () {
      clearInterval(orologio);
      S._enigma = null; torna();
    });
  }

  /* ── i comandi a schermo ─────────────────────────────────────────────── */
  function comandi() {
    var c = document.getElementById('bsiAP-comandi');
    if (!c || c.getAttribute('data-pronti') === '2') return;
    c.setAttribute('data-pronti', '2');
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
        '<button class="bsiAP-t" id="apB-cambia" aria-label="' + t('cambia quello che hai in mano', 'switch what you hold') + '">⟳</button>' +
        '<button class="bsiAP-t" id="apB-pausa" aria-label="' + t('pausa', 'pause') + '">❚❚</button>' +
        '<button class="bsiAP-t" data-k="salto" aria-label="' + t('salta', 'jump') + '">⤒</button>' +
        '<button class="bsiAP-t" id="apB-usa" aria-label="' + t('interagisci', 'interact') + '">✋</button>' +
        '<button class="bsiAP-t" id="apB-pot" aria-label="' + t('usa quello che hai in mano', 'use what you hold') + '">✦</button>' +
      '</div>';
    [].forEach.call(c.querySelectorAll('[data-k]'), function (b) {
      var k = b.getAttribute('data-k');
      function giu(e) { e.preventDefault(); tasti[k] = true; b.classList.add('giu'); }
      function su2(e) { if (e) e.preventDefault(); tasti[k] = false; b.classList.remove('giu'); }
      b.addEventListener('pointerdown', giu);
      b.addEventListener('pointerup', su2);
      b.addEventListener('pointercancel', su2);
      b.addEventListener('pointerleave', su2);
      b.addEventListener('lostpointercapture', su2);
    });
    su('apB-usa', function () { if (schermo === 'gioco') interagisci(); });
    su('apB-pot', function () { if (schermo === 'gioco') usaRapido(); });
    su('apB-cambia', function () { if (schermo === 'gioco') cambiaInMano(); });
    su('apB-inv', function () { if (!S) return; schermo = 'inventario'; fermaCiclo(); disegnaUI(); });
    su('apB-pausa', function () { if (!S) return; schermo = 'pausa'; fermaCiclo(); disegnaUI(); });
  }

  function disponibili() {
    return S.composti.map(function (c) { return c.id; })
      .concat(S.inventario.map(function (x) { return x.sim; }));
  }
  function cambiaInMano() {
    var d = disponibili();
    if (!d.length) { avviso(t('Non hai niente in mano', 'You are holding nothing')); return; }
    var i = d.indexOf(S.inMano);
    S.inMano = d[(i + 1) % d.length];
    bip(600, 0.04, 'square', 0.04);
    avviso('✦ ' + nomeInMano());
  }

  /* usare quello che si ha in mano: la scorciatoia del combattimento */
  function usaRapido() {
    if (elementoInMano()) lancio(); else spruzzo();
    if (S.boss && S.boss.attivo && /^enigma:/.test(faseCorrente(S.boss).serve)) { sfidaBoss(); return; }
    var d = disponibili();
    if (!d.length) {
      avviso(t('Non hai niente: cerca gli elementi e vai al banco di sintesi',
               'You have nothing: find the elements and go to the synthesis bench'));
      return;
    }
    if (d.indexOf(S.inMano) < 0) S.inMano = d[0];
    var id = S.inMano;
    if (usaSu(id) && ricetta(id)) {
      var c = S.composti.filter(function (x) { return x.id === id; })[0];
      if (c) {
        c.dosi--;
        if (c.dosi <= 0) {
          S.composti.splice(S.composti.indexOf(c), 1);
          S.inMano = disponibili()[0] || null;
        }
      }
    } else if (!ricetta(id)) {
      var x = S.inventario.filter(function (y) { return y.sim === id; })[0];
      if (x) { x.usi++; if (x.usi % 3 === 0 && x.padronanza < 5) x.padronanza++; }
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL CICLO E L'AVVIO
     ═════════════════════════════════════════════════════════════════════════ */
  function visibile() {
    var s = document.getElementById(ID);
    return !!(s && getComputedStyle(s).display !== 'none');
  }

  var dimPrec = '';
  function ciclo(ora) {
    anim = null;
    if (!visibile() || !pronto) { ultimo = 0; return; }
    if (!ultimo) ultimo = ora;
    var dt = Math.min(ora - ultimo, 200);
    ultimo = ora;
    accumulo += dt;
    var giri = 0;
    while (accumulo >= PASSO && giri < 5) { passo(); accumulo -= PASSO; giri++; }
    if (accumulo > PASSO * 5) accumulo = 0;
    if (S && mondo) {
      aggiornaVisibili();
      aggiornaLuci(false);
      /* i residui respirano: solo quelli della stanza in cui si e', e un
         fotogramma si' e uno no — la deformazione costa */
      /* le gocce cadono dal soffitto nella pozza */
      if (mondo.stanzaCorrente) (mondo.stanzaCorrente._gocce || []).forEach(function (gc) {
        var k = ((ora / 1400) + gc.fase) % 1;
        gc.o.position.y = gc.h * (1 - k * k);
        gc.o.visible = k < 0.97;
      });
      if ((S.t || 0) % 2 === 0) {
        var qui = mondo.stanzaCorrente;
        if (qui) (qui.oggetti || []).forEach(function (o) {
          if (o.tipo === 'nemico' && o.vivo && o._deforma) o._deforma(ora / 900 + o.t * 0.01);
        });
      }
      animaChimico();
      muoviCamera();
    }
    if (!ps1()) adattaDimensioni();
    if (ren && scena && camera) {
      if (vista && IMP.visuale === 'prima' && S && mondo && schermo === 'gioco') {
        ren.autoClear = false;
        ren.clear();
        ren.render(scena, camera);
        ren.clearDepth();
        ren.render(scenaMani, camMani);
        ren.autoClear = true;
      } else ren.render(scena, camera);
    }
    hud();
    anim = requestAnimationFrame(ciclo);
  }

  function avviaCiclo() { if (!anim && pronto) anim = requestAnimationFrame(ciclo); }
  function fermaCiclo() { if (anim) cancelAnimationFrame(anim); anim = null; ultimo = 0; }

  /* in realistica la scena si disegna alla risoluzione dello schermo; si
     controlla a ogni fotogramma — costa un confronto di stringhe — perche'
     il telefono si gira e il pieno schermo cambia le misure */
  function adattaDimensioni() {
    if (!ren || !tela) return;
    var w = tela.clientWidth || 640, h = tela.clientHeight || 480;
    var chiave = w + 'x' + h;
    if (chiave === dimPrec) return;
    dimPrec = chiave;
    ren.setSize(w, h, false);
    if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    if (camMani) { camMani.aspect = w / h; camMani.updateProjectionMatrix(); }
  }

  function applicaRisoluzione() {
    if (!ren) return;
    if (!ps1()) { dimPrec = ''; adattaDimensioni(); return; }
    var w = +IMP.risoluzione || 320;
    var h = Math.round(w * 3 / 4);
    ren.setSize(w, h, false);
    if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    if (camMani) { camMani.aspect = w / h; camMani.updateProjectionMatrix(); }
  }

  /* SMONTARE UN LIVELLO. Togliere il gruppo dalla scena non libera niente:
     geometrie e texture restano nella memoria della scheda video finche' non
     si chiede di buttarle. Su cento livelli la differenza fra un gioco che
     regge e uno che si pianta al trentesimo. Si buttano le geometrie e i
     materiali usati solo da questo livello; quelli condivisi (i materiali
     della grafica, le geometrie in cache) se usati di nuovo vengono
     ricaricati da Three da soli. */
  function smonta(radice) {
    var condivisi = {};
    if (G && G.M) Object.keys(G.M).forEach(function (k) { if (G.M[k]) condivisi[G.M[k].uuid] = true; });
    radice.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      var mats = o.material ? [].concat(o.material) : [];
      mats.forEach(function (m) {
        if (!m || condivisi[m.uuid]) return;
        ['map', 'emissiveMap'].forEach(function (k) {
          /* le texture delle figure sono in cache e si riusano: si butta
             solo quella dei cartelli, nuova a ogni stanza */
          if (m[k] && m[k].usaEGetta) m[k].dispose();
        });
        m.dispose();
      });
    });
  }

  function ricostruisci() {
    if (!scena) return;
    if (mondo && mondo.radice) { scena.remove(mondo.radice); smonta(mondo.radice); }
    mondo = costruisciMondo(S ? S.livello : 1);
  }

  /* cambiare grafica vuol dire un renderer nuovo (l'antialias si sceglie
     alla nascita) e materiali nuovi: si smonta tutto e si rimonta, e la
     partita resta dov'era — gli oggetti presi sono scritti nello stato */
  function rifai3D() {
    var inPartita = !!(S && mondo);
    var pos = inPartita ? { x: S.pos.x, z: S.pos.z, ang: S.ang } : null;
    fermaCiclo();
    try { if (ren) { ren.dispose(); if (ren.forceContextLoss) ren.forceContextLoss(); } } catch (e) {}
    if (tela && tela.parentNode) tela.parentNode.removeChild(tela);
    ren = null; scena = null; camera = null; tela = null; G = null;
    chimico = null; mani = null; luci = null; mondo = null; camLiscia = null;
    scenaMani = null; camMani = null; vista = null;
    pronto = false; dimPrec = '';
    avvia3D(function (ok) {
      if (!ok || !inPartita) { disegnaUI(); return; }
      ricostruisci();
      S.pos.x = pos.x; S.pos.z = pos.z; S.ang = pos.ang;
      if (S.boss) S.boss = null;
      disegnaUI();
      if (schermo === 'gioco') avviaCiclo();
    });
  }

  function cominciaPartita() {
    if (!pronto) { avvia3D(function () { if (pronto) cominciaPartita(); }); return; }
    if (!S) nuovaPartita(1);
    /* le vite si ricaricano a ogni livello: la difficolta' decide quante */
    var d = diff();
    S.vite = d.vite; S.vitaMax = d.vite;
    S.finito = null; S.boss = null; S.fatti = {}; S.presi = {}; S.visitate = {};
    S.rapide = 0; S.tentativi = 0;
    ricetteDovute(S.livello).forEach(function (id) { sbloccaRicetta(id, true); });
    salva();
    ricostruisci();
    var p = mondo.zona.partenza;
    var st = mondo.zona.stanze.filter(function (x) { return x.id === p.stanza; })[0];
    S.pos.x = st.x + p.x; S.pos.z = st.z + p.z; S.pos.y = 0;
    /* si parte guardando verso la porta della stanza: chi entra in un
       livello nuovo deve vedere dove andare, non un muro */
    var porta = (st.porte || [])[0];
    var versi = { nord: 0, ovest: Math.PI / 2, sud: Math.PI, est: -Math.PI / 2 };
    S.ang = porta ? versi[porta.verso] : 0;
    S.angY = 0; S.immune = 0;
    camLiscia = null;
    mondo.stanzaCorrente = null;
    aggiornaVisibili();
    schermo = 'gioco';
    disegnaUI();
    avviaCiclo();
    avviso(mondo.livello.nome, mondo.livello.boss
      ? '☠ ' + mondo.livello.boss.nome + ' · ' + mondo.livello.boss.natura
      : t('trova il terminale · ✋ per interagire', 'find the terminal · ✋ to interact'));
  }

  function avvia3D(cb) {
    cb = cb || function () {};
    if (pronto) { cb(true); return; }
    caricaThree(function (ok) {
      if (!ok || !T) { errore3d = errore3d || 'THREE non disponibile'; cb(false); return; }
      if (!GR() || !LIV()) { errore3d = 'moduli del gioco non caricati'; cb(false); return; }
      var cont = document.getElementById('bsiAP-scena');
      if (!cont) { cb(false); return; }
      try {
        tela = document.createElement('canvas');
        tela.id = 'bsiAP-tela';
        if (ps1()) tela.className = 'ps1';
        cont.insertBefore(tela, cont.firstChild);
        var alta = IMP.grafica === 'alta';
        ren = new T.WebGLRenderer({ canvas: tela, antialias: alta, powerPreference: 'high-performance' });
        ren.setPixelRatio(ps1() ? 1 : Math.min(globale.devicePixelRatio || 1, alta ? 1.5 : 1));
        scena = new T.Scene();
        camera = new T.PerspectiveCamera(ps1() ? 70 : 62, 4 / 3, 0.05, 80);
        G = GR().crea(T, { qualita: IMP.grafica });
        G.configura(ren);
        G.ambiente(ren, scena);
        luci = creaLuci();
        chimico = G.chimico();
        scena.add(chimico.nodo);
        creaVista();
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
    var mappa2 = {
      ArrowUp: 'su', w: 'su', W: 'su',
      ArrowDown: 'giu', s: 'giu', S: 'giu',
      ArrowLeft: 'sx', a: 'sx', A: 'sx',
      ArrowRight: 'dx', d: 'dx', D: 'dx',
      q: 'latSx', Q: 'latSx', e: 'latDx', E: 'latDx',
      ' ': 'salto', Shift: 'corsa'
    };
    document.addEventListener('keydown', function (ev) {
      if (!visibile() || !S) return;
      var tag = (ev.target && ev.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      var k = mappa2[ev.key];
      /* in prima persona A e D vanno di lato, come in ogni gioco in prima
         persona: a girare ci pensano il mouse e le frecce */
      if (IMP.visuale === 'prima' && /^[aAdD]$/.test(ev.key)) k = /[aA]/.test(ev.key) ? 'latSx' : 'latDx';
      if (k && schermo === 'gioco') {
        tasti[k] = true;
        if (ev.key === ' ' || ev.key.indexOf('Arrow') === 0) ev.preventDefault();
        return;
      }
      var tt = ev.key.toLowerCase();
      if (schermo === 'gioco') {
        if (tt === 'f') interagisci();
        else if (tt === 'x') usaRapido();
        else if (tt === 'r') cambiaInMano();
        else if (tt === 'i') { schermo = 'inventario'; fermaCiclo(); disegnaUI(); }
        else if (tt === 'c') { schermo = 'codex'; fermaCiclo(); disegnaUI(); }
        else if (ev.key === 'Escape' || tt === 'p') { schermo = 'pausa'; fermaCiclo(); disegnaUI(); }
        else if (tt === 'v') {
          scriviImp('visuale', IMP.visuale === 'prima' ? 'terza' : 'prima');
          camLiscia = null;
          avviso(t('visuale: ', 'view: ') + (IMP.visuale === 'prima'
            ? t('prima persona', 'first person') : t('terza persona', 'third person')));
        }
      } else if ((ev.key === 'Escape' || tt === 'p') &&
                 ['pausa', 'inventario', 'codex', 'lettura'].indexOf(schermo) >= 0 && mondo && !S.finito) {
        torna();
      }
    });
    document.addEventListener('keyup', function (ev) {
      var k = mappa2[ev.key];
      if (k) tasti[k] = false;
      if (/^[aAdD]$/.test(ev.key)) { tasti.latSx = tasti.latDx = false; }
    });
    globale.addEventListener('blur', function () { tasti = {}; });
  }

  /* GUARDARSI INTORNO. Sul computer si clicca sulla scena e il mouse muove
     lo sguardo (il puntatore resta bloccato; Esc lo libera); sul telefono si
     trascina il dito sulla scena. Lo sguardo verticale e' limitato, come la
     testa vera */
  function sguardo(dx, dy, k) {
    if (!S || schermo !== 'gioco') return;
    S.ang -= dx * k;
    S.angY = Math.max(-1.1, Math.min(1.1, S.angY - dy * k * 0.9));
  }
  function mouseETocco() {
    var sc = document.getElementById('bsiAP-scena');
    if (!sc || sc.getAttribute('data-sguardo')) return;
    sc.setAttribute('data-sguardo', '1');
    sc.addEventListener('click', function (e) {
      if (schermo !== 'gioco' || !tela || e.target.closest('button')) return;
      if (tela.requestPointerLock && document.pointerLockElement !== tela) {
        try { tela.requestPointerLock(); } catch (er) {}
      }
    });
    document.addEventListener('mousemove', function (e) {
      if (tela && document.pointerLockElement === tela) sguardo(e.movementX || 0, e.movementY || 0, 0.0024);
    });
    var tocco = null;
    sc.addEventListener('touchstart', function (e) {
      if (schermo !== 'gioco' || e.target.closest('button')) return;
      var t0 = e.changedTouches[0];
      tocco = { id: t0.identifier, x: t0.clientX, y: t0.clientY };
    }, { passive: true });
    sc.addEventListener('touchmove', function (e) {
      if (!tocco) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t1 = e.changedTouches[i];
        if (t1.identifier !== tocco.id) continue;
        sguardo(t1.clientX - tocco.x, t1.clientY - tocco.y, 0.006);
        tocco.x = t1.clientX; tocco.y = t1.clientY;
        e.preventDefault();
      }
    }, { passive: false });
    sc.addEventListener('touchend', function () { tocco = null; });
    sc.addEventListener('touchcancel', function () { tocco = null; });
  }

  /* IL PULSANTE DEL GIOCO. Non sta piu' nella barra delle sezioni: sta con
     i pulsanti flottanti, sopra Spectra e il menu ✨, con un'icona sua.
     Nella barra resta un pulsante NASCOSTO con lo stesso data-s: e' quello
     che il sito usa per cambiare sezione, e non si duplica la navigazione —
     il pulsante flottante lo preme. */
  var ICONA = '<svg class="ap-ico" viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">' +
    '<defs><linearGradient id="apGrE" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#b48cff"/><stop offset="1" stop-color="#3ee0ff"/></linearGradient>' +
    '<linearGradient id="apGrL" x1="0" y1="26" x2="0" y2="40" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#ffd34d"/><stop offset="1" stop-color="#ff6a2a"/></linearGradient>' +
    '<radialGradient id="apGrN" cx="24" cy="31" r="9" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#ffb030" stop-opacity="0"/></radialGradient></defs>' +
    /* l'esagono: l'anello del benzene, e lo scudo del contenimento */
    '<path d="M24 3.5 L41.8 13.75 L41.8 34.25 L24 44.5 L6.2 34.25 L6.2 13.75 Z" fill="rgba(20,12,40,.55)" ' +
      'stroke="url(#apGrE)" stroke-width="2.4" stroke-linejoin="round"/>' +
    /* la beuta, con il liquido che brilla */
    '<path d="M20.5 12 L27.5 12 M21.8 12 L21.8 20.5 L14.8 34.2 Q13.6 37 16.8 37 L31.2 37 Q34.4 37 33.2 34.2 ' +
      'L26.2 20.5 L26.2 12" fill="none" stroke="#e8f2ff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<path d="M17.4 29 Q20.5 27.4 24 29 T30.6 29 L32.3 33.6 Q33 35.6 30.8 35.6 L17.2 35.6 Q15 35.6 15.7 33.6 Z" fill="url(#apGrL)"/>' +
    '<circle cx="24" cy="31" r="9" fill="url(#apGrN)"/>' +
    '<circle cx="21" cy="32.4" r="1.2" fill="#fff8e0"/><circle cx="26.5" cy="30.6" r="0.9" fill="#fff8e0"/>' +
    /* l'orbita con l'elettrone, che gira */
    '<g><ellipse cx="24" cy="24" rx="19" ry="6.2" fill="none" stroke="rgba(62,224,255,.75)" stroke-width="1.3" ' +
      'transform="rotate(-28 24 24)"/>' +
    '<circle cx="43" cy="24" r="2.4" fill="#3ee0ff" transform="rotate(-28 24 24)">' +
      '<animateTransform attributeName="transform" type="rotate" from="-28 24 24" to="332 24 24" dur="3.2s" ' +
      'repeatCount="indefinite"/></circle></g></svg>';

  function pulsante() {
    var b = document.querySelector('.nav-btn[data-s="' + ID + '"]');
    if (!b) {
      var gruppo = document.getElementById('navGroup0');
      if (!gruppo) return null;
      b = document.createElement('button');
      b.className = 'nav-btn';
      b.setAttribute('data-s', ID);
      gruppo.appendChild(b);
    }
    b.textContent = NOME;
    b.hidden = true;
    b.setAttribute('aria-hidden', 'true');
    b.tabIndex = -1;
    fab();
    return b;
  }

  function fab() {
    var f = document.getElementById('bsi-gioco-fab');
    if (!f) {
      f = document.createElement('button');
      f.id = 'bsi-gioco-fab';
      f.type = 'button';
      f.innerHTML = ICONA + '<span class="ap-tx"><b>ATOMIC</b><small>PROTOCOL</small></span>';
      f.onclick = function (e) {
        e.stopPropagation();
        var nav = document.querySelector('.nav-btn[data-s="' + ID + '"]');
        if (nav) nav.click();
      };
      document.body.appendChild(f);
      globale.addEventListener('resize', ancoraFab);
      /* il pulsante ✨ viene sistemato dagli altri moduli nei primi secondi:
         ci si appoggia a lui per un po', poi solo quando la finestra cambia */
      var n = 0, iv = setInterval(function () { ancoraFab(); if (++n > 40) clearInterval(iv); }, 750);
    }
    f.title = t('ATOMIC PROTOCOL — il gioco di chimica in prima persona', 'ATOMIC PROTOCOL — the first-person chemistry game');
    f.setAttribute('aria-label', t('Apri ATOMIC PROTOCOL, il gioco', 'Open ATOMIC PROTOCOL, the game'));
    ancoraFab();
  }
  /* sopra Spectra, allineato a destra con lui; se Spectra non c'e', sopra ✨ */
  function ancoraFab() {
    var f = document.getElementById('bsi-gioco-fab');
    var sotto = document.getElementById('bsi-spectra-fab') || document.getElementById('bsi14-fab');
    if (!f || !sotto) return;
    var r = sotto.getBoundingClientRect();
    if (!r.height) return;
    f.style.setProperty('bottom', Math.round(globale.innerHeight - r.top + 10) + 'px', 'important');
    f.style.setProperty('right', Math.round(globale.innerWidth - r.right) + 'px', 'important');
  }
  /* mentre la sezione del gioco e' aperta i pulsanti flottanti si tolgono
     di mezzo: coprivano la scena 3D proprio dove stanno i comandi */
  function segnaSezione() {
    var v = visibile();
    document.body.classList.toggle('bsiAP-sezione', v);
    /* il sito sa nascondere i suoi pulsanti flottanti: glielo si chiede */
    if (typeof globale._bsiSyncFabs === 'function') globale._bsiSyncFabs();
    if (!v) {
      taciNastro();
      if (tela && document.pointerLockElement === tela) { try { document.exitPointerLock(); } catch (e) {} }
      tasti = {};
    }
  }

  function applica() {
    leggiImp();
    caricaDati();
    stile();
    sezione();
    intro();
    pulsante();
    mouseETocco();
    disegnaUI();
    return true;
  }

  function avvia() {
    applica();
    tastiera();
    [500, 1500, 3000].forEach(function (ms) { setTimeout(applica, ms); });
    document.addEventListener('click', function (e) {
      var nb = e.target && e.target.closest && e.target.closest('.nav-btn');
      if (nb) setTimeout(segnaSezione, 80);
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

  document.addEventListener('bsi-lingua', function () {
    caricaDati(); DIFFICOLTA = ricreaDifficolta();
    if (globale.BSIAtomic) globale.BSIAtomic.DIFFICOLTA = DIFFICOLTA;
    var c = document.getElementById('bsiAP-comandi');
    if (c) c.removeAttribute('data-pronti');
    hudPrec = {};
    intro(); disegnaUI();
  });

  caricaDati();

  globale.BSIAtomic = {
    ID: ID, NOME: NOME, IMP: IMP, DIFFICOLTA: DIFFICOLTA,
    POTERI: POTERI, RICETTE: RICETTE, datiElemento: datiElemento,
    leggiImp: leggiImp, scriviImp: scriviImp, diff: diff,
    nuovaPartita: nuovaPartita, cominciaPartita: cominciaPartita,
    applica: applica, avvia3D: avvia3D, rifai3D: rifai3D,
    stato: function () { return S; },
    schermo: function (x) { if (x) { schermo = x; disegnaUI(); } return schermo; },
    tasti: function (k, giu) { if (k) tasti[k] = !!giu; return tasti; },
    passo: passo, interagisci: interagisci, usaSu: usaSu, usaRapido: usaRapido,
    sintetizza: sintetizza, ricettaPer: ricettaPer, coefficienti: coefficienti,
    rispondiEnigma: rispondiEnigma, apriEnigma: apriEnigma, sfidaBoss: sfidaBoss,
    completaLivello: completaLivello, salva: salva, salvataggio: salvataggio,
    riprendi: riprendi, livelloMax: livelloMax, ricetteDovute: ricetteDovute,
    stanzaDi: function (x, z) { return stanzaDi(x, z); },
    puoStare: function (x, z) { return puoStare(x, z); },
    bersaglio: bersaglio, avviaCiclo: avviaCiclo, fermaCiclo: fermaCiclo,
    pronto: function () { return pronto; }, perche3d: function () { return errore3d; },
    mondo: function () { return mondo; },
    motore: function () { return { ren: ren, scena: scena, camera: camera, G: G, luci: luci, chimico: chimico,
                                   vista: vista, scenaMani: scenaMani, camMani: camMani, animV: animV }; },
    spruzzo: function () { spruzzo(); },
    lancio: function () { lancio(); },
    sguardo: function (dx, dy) { sguardo(dx, dy, 0.0024); },
    TRAMA: TRAMA, ascolta: function (id) { ascolta(id); }, nastro: function () { return nastro; },
    versione: '2.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
