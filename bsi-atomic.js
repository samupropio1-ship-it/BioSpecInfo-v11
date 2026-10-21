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
    risdin: 'si',            /* risoluzione dinamica: si | no */
    torcia: 'si',            /* la torcia sulla telecamera */
    degrado: 'si',           /* l'istituto abbandonato: si | no (stanze in ordine) */
    sangue: 'si',            /* si | ridotto (niente macchie ne' brandelli) */
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
      atto2: t('Atto II · Il riflusso. Ti svegli sul banco della prima ala. Le pareti sono le stesse, ma ' +
           'piu\u2019 fredde, e la luce e\u2019 azzurra. Sul monitor: «Protocollo 12 ripreso. Istruzione ' +
           'archiviata n. 2». Il Custode non risponde. Qualcuno ha ricostruito le macchine — e ' +
           'le creature nelle ali sono cambiate.',
           'Act II · The backflow. You wake on the bench of the first wing. The walls are the same, ' +
           'but colder, and the light is blue. On the monitor: «Protocol 12 resumed. Archived ' +
           'instruction no. 2». The Custodian does not answer. Someone has rebuilt the machines — ' +
           'and the creatures in the wings have changed.'),
      atto2b: t('Un foglio di Ferri, il legale del Consorzio Albedo: «Il protocollo deve completare il ' +
           'ciclo. Ogni volta che viene fermato, il nucleo lo ricostruisce un po\u2019 piu\u2019 forte. ' +
           'Il direttore lo sa: per questo ha lasciato due istruzioni archiviate.» Due. Ne hai trovata una.',
           'A note by Ferri, the Albedo Consortium lawyer: «The protocol must complete its cycle. ' +
           'Every time it is stopped, the core rebuilds it a little stronger. The director knows: ' +
           'that is why he left two archived instructions.» Two. You have found one.'),
      atto3: t('Atto III · Il nucleo profondo. Il calore del nucleo e\u2019 salito nelle ali: le pareti ' +
           'sudano, la luce e\u2019 rossa. Il Custode, debole: «Ultima istruzione archiviata. Se ' +
           'fermi il Protocollo adesso, si ferma per sempre. Ma devi arrivare in fondo.»',
           'Act III · The deep core. The core’s heat has risen into the wings: the walls sweat, ' +
           'the light is red. The Custodian, faint: «Last archived instruction. If you stop the ' +
           'Protocol now, it stops for good. But you must reach the bottom.»'),
      atto3b: t('La tua calligrafia, di nuovo, su un foglio bruciato a meta\u2019: «Se leggi questo, ' +
           'sei arrivato piu\u2019 lontano di me. Non riprendere. Non riprendere. Non riprendere.» ' +
           'Sotto, piu\u2019 piccolo: «la chimica lo puo\u2019 fermare — l\u2019argon, l\u2019oro, il piombo».',
           'Your handwriting, again, on a half-burnt sheet: «If you read this, you got further than ' +
           'me. Do not resume. Do not resume. Do not resume.» Below, smaller: «chemistry can stop ' +
           'it — argon, gold, lead».'),
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
  var attoAperto = 0;        /* l'atto aperto nella scelta dei livelli */
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
  /* lo stato delle mosse che si vede: il campo visivo che si allarga nello
     scatto, la testa che s'inclina, l'affondo, la carica del potere */
  var mosse = { fov: 0, rollio: 0, chino: 0, affondo: 0, carica: 0, caricando: false, combo: 0, finestra: 0, esegui: null, sangue: 0 };
  /* IL TEMPO: fermo un istante sui colpi (hitstop), lento nelle esecuzioni */
  var tempoG = { fermo: 0, lento: 0 };
  function fermaTempo(s) { if (!ps1()) tempoG.fermo = Math.max(tempoG.fermo, s); }
  function rallenta(s) { tempoG.lento = Math.max(tempoG.lento, s); }
  function scalaTempo(dtS) {
    if (tempoG.fermo > 0) { tempoG.fermo -= dtS; return 0.05; }
    if (tempoG.lento > 0) { tempoG.lento -= dtS; return 0.3; }
    return 1;
  }

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
                 ricette: S.ricette, codex: S.codex, punti: S.punti, checkpoint: S.checkpoint || null,
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
    S.ripresa = x.checkpoint && x.checkpoint.livello === x.livello ? x.checkpoint : null;
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
    } else if (o.tipo === 'nemico' && SPECIE_M[o.specie]) {
      /* il nemico dal modello: subito un segnaposto della sua forma (se il
         modello non e' ancora arrivato), poi il modello vero */
      var SM = SPECIE_M[o.specie];
      var seg = (SM.modo === 'sputo' || SM.modo === 'fluttua') ? G.drone(SM.colore) : G.automa(SM.colore);
      seg.gruppo.scale.setScalar(SM.alto * variante(o).scala / 2.1);
      g.add(seg.gruppo);
      o._segnaposto = seg.gruppo; o._parti = null; o._mat = seg.materiali.slice();
      o.vivo = true; o.t = (h % 100); o.vita = specieDi(o).vita;
      montaModelloNemico(o, g);
    } else if (o.tipo === 'nemico' && o.specie === 'drone' && G.drone) {
      var dr = G.drone(0xff5a3a);
      g.add(dr.gruppo);
      o._corpo = dr.gruppo; o._parti = dr; o._mat = dr.materiali.map(function (m4) { return m4; });
      o.vivo = true; o.t = (h % 100); o.vita = SPECIE.drone.vita;
      o.casaX = o.x; o.casaZ = o.z;
    } else if (o.tipo === 'nemico' && o.specie === 'automa' && G.automa) {
      var au = G.automa(0xff8a3a);
      g.add(au.gruppo);
      o._corpo = au.gruppo; o._parti = au; o._mat = au.materiali;
      o.vivo = true; o.t = (h % 100); o.vita = SPECIE.automa.vita;
      o.casaX = o.x; o.casaZ = o.z;
    } else if (o.tipo === 'nemico') {
      var r = G.residuo(COLORI_RESIDUO[(zonaN - 1) % COLORI_RESIDUO.length]);
      r.gruppo.position.y = 0.34;
      g.add(r.gruppo);
      o._corpo = r.gruppo; o._deforma = r.deforma; o.vita = SPECIE.residuo.vita;
      o._mat = []; r.gruppo.traverse(function (m5) { if (m5.isMesh && m5.material.emissive && o._mat.indexOf(m5.material) < 0) o._mat.push(m5.material); });
      o.vivo = true; o.t = (h % 100);
      o.casaX = o.x; o.casaZ = o.z;
    } else if (o.tipo === 'boss') {
      var B = LIV().GUARDIANI()[livello];
      var gu = G.guardiano(B ? B.modello : 'pompa');
      /* i guardiani ricostruiti: gelo nel secondo atto, calore nel terzo */
      if (B && B.atto > 1) {
        var tB = new T.Color(B.atto === 2 ? 0x6ab4ff : 0xff4a14);
        gu.gruppo.traverse(function (m6) {
          if (!m6.isMesh || !m6.material || Array.isArray(m6.material)) return;
          m6.material = m6.material.clone();
          if (m6.material.color) m6.material.color.lerp(tB, 0.3);
          if (m6.material.emissive) m6.material.emissive.lerp(tB, 0.5);
        });
        gu.gruppo.scale.multiplyScalar(1 + 0.1 * (B.atto - 1));
      }
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
    } else if (o.tipo === 'salvataggio') {
      /* la stazione: una colonna d'ottone con la lente verde e l'anello
         che gira; attiva, la luce diventa d'oro */
      var col0 = new T.Mesh(G.tonda(0.32, 1.4, 0.32, 0.05), G.M.ottone || G.M.acciaio);
      col0.position.y = 0.7; col0.castShadow = !ps1(); g.add(col0);
      var len = new T.Mesh(new T.SphereGeometry(0.18, 20, 14), G.mat({ color: 0x0a2a14, emissive: 0x2aff7a, emissiveIntensity: 2.2 }));
      len.position.y = 1.55; g.add(len);
      var an2 = new T.Mesh(new T.TorusGeometry(0.34, 0.025, 8, 36), G.mat({ color: 0x0a2a14, emissive: 0x2aff7a, emissiveIntensity: 2 }));
      an2.position.y = 1.55; g.add(an2);
      var alS = G.alone ? G.alone(0x2aff7a, 0.9, 0.5) : null; if (alS) { alS.position.y = 1.55; g.add(alS); }
      o._lente = len; o._anello = an2; o._aloneS = alS;
      o._solido = { l: 0.5, p: 0.5 };
    } else if (o.tipo === 'portaLab') {
      var nl = NOMI_LAB[o.mappa] || [o.mappa, o.mappa];
      g.add(costruisciPortaLab(t('LABORATORIO', 'LABORATORY'), t(nl[0], nl[1])));
      o._solido = solidoRuotato(1.9, 0.5, o.ruota);
    }
    return g;
  }

  /* UNIRE LA GEOMETRIA STATICA. Una stanza e' fatta di centinaia di pezzi
     (pannelli, cornici, lesene, tubi, arredi): disegnarli uno per uno vuol
     dire centinaia di chiamate alla scheda grafica, piu' altrettante per
     le ombre. Quello che non si muove si fonde, una volta, in un blocco per
     materiale: stesso aspetto, una frazione del costo. Restano separati i
     pezzi che si muovono o cambiano (segnati con userData.mobile) e le
     immagini in sovrimpressione */
  /* due materiali con lo stesso aspetto sono lo stesso materiale, anche se
     sono due oggetti diversi (la grafica ne crea uno per pezzo) */
  function firmaMateriale(m) {
    if (m.userData.firma) return m.userData.firma;
    var c = function (x) { return x ? x.getHexString() : '-'; }, tx = function (x) { return x ? x.uuid : '-'; };
    return (m.userData.firma = [m.type, c(m.color), c(m.emissive), m.emissiveIntensity, tx(m.map), tx(m.normalMap),
      tx(m.roughnessMap), tx(m.metalnessMap), tx(m.emissiveMap), tx(m.aoMap), tx(m.alphaMap), m.roughness, m.metalness,
      m.envMapIntensity, m.transparent, m.opacity, m.side, m.flatShading, m.vertexColors, m.alphaTest, m.depthWrite,
      m.toneMapped, m.userData.ps1 ? 1 : 0, m.onBeforeCompile ? m.onBeforeCompile.toString().length : 0,
      m.normalScale ? m.normalScale.x : '', m.clearcoat || 0].join('|'));
  }
  function unisciStatici(radice) {
    radice.updateMatrixWorld(true);
    var inv = new T.Matrix4().copy(radice.matrixWorld).invert();
    var gruppi = {}, via = [];
    (function visita(o, mobile) {
      if (o.userData && o.userData.mobile) mobile = true;
      /* (i gruppi di una geometria contano solo con piu' materiali: con uno
         solo three li ignora, e si possono ignorare anche qui) */
      if (!mobile && o.isMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && o.geometry && o.geometry.isBufferGeometry &&
          !o.geometry.morphAttributes.position && o.visible) {
        var g = o.geometry, nomi = Object.keys(g.attributes).sort();
        var k = firmaMateriale(o.material) + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + nomi.join(',') + '|' + o.renderOrder;
        (gruppi[k] || (gruppi[k] = { mat: o.material, ombra: o.castShadow, riceve: o.receiveShadow, ordine: o.renderOrder, nomi: nomi, pezzi: [] })).pezzi.push(o);
      }
      o.children.forEach(function (c) { visita(c, mobile); });
    })(radice, false);
    var fusi = 0, prima = 0;
    Object.keys(gruppi).forEach(function (k) {
      var gr = gruppi[k];
      if (gr.pezzi.length < 2) return;
      var parti = gr.pezzi.map(function (o) {
        var gg = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        gg.clearGroups();
        gg.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
        return gg;
      });
      var tot = 0; parti.forEach(function (gg) { tot += gg.attributes.position.count; });
      var nuova = new T.BufferGeometry();
      gr.nomi.forEach(function (nome) {
        var a0 = parti[0].attributes[nome], dim = a0.itemSize, arr = new Float32Array(tot * dim), off = 0;
        parti.forEach(function (gg) {
          var a = gg.attributes[nome];
          if (!a.isInterleavedBufferAttribute && a.array.length === a.count * dim && !a.normalized) arr.set(a.array, off * dim);
          else for (var i = 0; i < a.count; i++) {
            arr[(off + i) * dim] = a.getX(i);
            if (dim > 1) arr[(off + i) * dim + 1] = a.getY(i);
            if (dim > 2) arr[(off + i) * dim + 2] = a.getZ(i);
            if (dim > 3) arr[(off + i) * dim + 3] = a.getW(i);
          }
          off += a.count;
        });
        nuova.setAttribute(nome, new T.BufferAttribute(arr, dim));
      });
      nuova.computeBoundingSphere(); nuova.computeBoundingBox();
      parti.forEach(function (gg) { gg.dispose(); });
      var m = new T.Mesh(nuova, gr.mat);
      m.castShadow = gr.ombra; m.receiveShadow = gr.riceve; m.renderOrder = gr.ordine;
      m.userData.fusa = gr.pezzi.length;
      radice.add(m);
      gr.pezzi.forEach(function (o) { via.push(o); });
      fusi++; prima += gr.pezzi.length;
    });
    via.forEach(function (o) { if (o.parent) o.parent.remove(o); });
    return { prima: prima, dopo: fusi };
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
      /* quanto e' devastata: poco all'inizio, del tutto dal sessantesimo
         livello e negli atti II e III */
      st.livello = n;
      st.degrado = IMP.degrado === 'no' ? 0 : 0.45 + 0.55 * Math.min(1, n / 60);
      st.senzaSangue = IMP.sangue === 'ridotto';
      var sg = new T.Group();
      sg.position.set(st.x, 0, st.z);
      var stz = G.stanza(st, vaniPerStanza(st));
      sg.add(stz.gruppo);
      st._g = sg;
      st._emergenza = stz.emergenza;
      /* una stanza su tre ha l'allarme acceso: la luce rossa che gira */
      st._allarme = IMP.degrado !== 'no' && (String(st.id).length * 7 + n * 3 + st.x * 13 + st.z * 5) % 3 === 0;
      st._gocce = stz.gocce || [];
      st._gocce.forEach(function (gc) { if (gc.o) gc.o.userData.mobile = true; });
      stz.luci.forEach(function (l) {
        /* nell'istituto abbandonato una lampada su quattro ha il neon
           guasto: sfarfalla */
        var hL = 0; String(st.id + ':' + l.x + ':' + l.z).split('').forEach(function (ch) { hL = (hL * 31 + ch.charCodeAt(0)) % 9973; });
        luciMondo.push({ x: st.x + l.x, y: l.y, z: st.z + l.z, stanza: st.id, sfarfalla: IMP.degrado !== 'no' && hL % 4 === 0 });
      });
      (st.oggetti || []).forEach(function (o, k) {
        var nodo = costruisciOggetto(o, st, k, liv.zona.n, n);
        /* restano a parte gli oggetti che si muovono, si prendono o cambiano */
        if (['scaffale', 'fusto', 'fusti', 'cappa', 'banco'].indexOf(o.tipo) < 0) nodo.userData.mobile = true;
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
        pa.gruppo.userData.mobile = true;
        paratie.push({ chiave: p.chiusa, p: pa, apertura: (S && S.fatti[p.chiusa]) ? 1 : 0 });
      });
      /* la stanza costruita: quello che non si muove diventa pochi blocchi */
      st._degrado = 0;
      if (stz.degrado) stz.degrado.traverse(function (m) { if (m.isMesh) st._degrado++; });
      st._fusi = unisciStatici(sg);
      radice.add(sg);
    });
    scena.add(radice);
    scegliOrda(liv, n);
    var nebbia = liv.zona.nebbia;
    if (ps1()) scena.fog = new T.Fog(nebbia, 4, 22);
    else {
      /* LA NEBBIA DELL'ABBANDONO: piu' scura e piu' fredda, piu' densa —
         gli angoli lontani spariscono, la luce delle lampade ci si vede
         dentro */
      var nb = new T.Color(nebbia);
      if (IMP.degrado !== 'no') nb.lerp(new T.Color(0x0a1016), 0.55);
      nebbia = nb.getHex();
      scena.fog = new T.FogExp2(nebbia, IMP.degrado !== 'no' ? 0.072 : 0.055);
    }
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
      g.lampo = new T.PointLight(0xffffff, 0, 10, 2);
      scena.add(g.lampo);
      return g;
    }
    g.emi = new T.HemisphereLight(0xb8a890, 0x14100c, IMP.degrado !== 'no' ? 0.13 : 0.2);
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
    /* LA TORCIA: un cono stretto dalla spalla destra, che segue lo sguardo
       con un attimo di ritardo e ogni tanto tremola; senza ombre (la loro
       ombra cadrebbe dietro le cose, dove non si vede) */
    if (IMP.torcia !== 'no') {
      var tc = new T.SpotLight(0xdfe8ff, 1.8, 15, Math.PI / 7.5, 0.65, 1.6);
      scena.add(tc); scena.add(tc.target);
      g.torcia = tc; g.dirTorcia = null;
    }
    /* la luce d'allarme: rossa, gira, nelle stanze con l'allarme acceso e
       in quelle dove si scatena un'orda */
    g.allarme = new T.PointLight(0xff1a0a, 0, 10, 2);
    scena.add(g.allarme);
    /* I CONI DI LUCE sotto le lampade: l'aria polverosa dell'istituto si
       vede dove la luce la attraversa. Un cono aperto, additivo, che sfuma
       verso il basso e sui bordi */
    var geoCono = new T.CylinderGeometry(0.12, 1.25, 1, 28, 1, true);
    geoCono.translate(0, -0.5, 0);
    var matCono = new T.ShaderMaterial({
      uniforms: { colore: { value: new T.Color(0xffe8cc) } },
      vertexShader: 'varying float vH; varying vec3 vN; varying vec3 vV; void main(){ vH = -position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 colore; varying float vH; varying vec3 vN; varying vec3 vV; void main(){ float bordo = pow(abs(dot(normalize(vN), normalize(vV))), 2.0); float a = 0.075 * bordo * (1.0 - vH) * (1.0 - vH); gl_FragColor = vec4(colore * a, 1.0); }',
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false
    });
    g.coni = g.punti.map(function () { var m = new T.Mesh(geoCono, matCono); m.visible = false; m.renderOrder = 2; scena.add(m); return m; });
    g.matCono = matCono;
    /* LA POLVERE nell'aria: granelli che galleggiano intorno a chi guarda,
       appena visibili, che scendono piano e girano */
    var NP = 420, pos = new Float32Array(NP * 3);
    for (var q = 0; q < NP; q++) { pos[q * 3] = (Math.random() - 0.5) * 9; pos[q * 3 + 1] = Math.random() * 3.4; pos[q * 3 + 2] = (Math.random() - 0.5) * 9; }
    var geoP = new T.BufferGeometry(); geoP.setAttribute('position', new T.BufferAttribute(pos, 3));
    var cv = document.createElement('canvas'); cv.width = cv.height = 32;
    var cq = cv.getContext('2d'), gr = cq.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cq.fillStyle = gr; cq.fillRect(0, 0, 32, 32);
    var polvere = new T.Points(geoP, new T.PointsMaterial({ size: 0.022, map: new T.CanvasTexture(cv), color: 0xffe2c0, transparent: true, opacity: 0.55,
                                                             depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    polvere.frustumCulled = false; scena.add(polvere);
    g.polvere = polvere;
    /* la luce del guardiano: rossa, pulsa quando attacca */
    g.boss = new T.PointLight(0xff4020, 0, 9);
    scena.add(g.boss);
    /* il lampo dei colpi e dei poteri: una luce sola, che si sposta */
    g.lampo = new T.PointLight(0xffffff, 0, 10, 2);
    scena.add(g.lampo);
    return g;
  }

  var contaLuci = 0;
  function aggiornaLuci(forza) {
    if (!luci || !mondo || !luci.punti.length) return;
    contaLuci++;
    if (!forza && contaLuci % 12) return;
    var st = S.lab ? null : stanzaDi(S.pos.x, S.pos.z);
    var id = st ? st.id : null;
    var ord = (S.lab ? S.lab.luci : mondo.luci).slice().sort(function (a, b) {
      var da = Math.hypot(a.x - S.pos.x, a.z - S.pos.z) + (a.stanza === id ? 0 : 40);
      var db = Math.hypot(b.x - S.pos.x, b.z - S.pos.z) + (b.stanza === id ? 0 : 40);
      return da - db;
    });
    var colore = mondo.ala.luce || 0xffe8cc;
    luci.punti.forEach(function (p, i) {
      var l = ord[i];
      if (l) { p.position.set(l.x, l.y, l.z); p.color.setHex(colore); p.intensity = ps1() ? 0.9 : 0.55; }
      else p.intensity = 0;
      p.userData.base = p.intensity; p.userData.sfarfalla = !!(l && l.sfarfalla);
      var cn = luci.coni && luci.coni[i];
      if (cn) {
        cn.visible = !!l && !S.lab && i < 3;
        if (l) { cn.position.set(l.x, l.y - 0.08, l.z); cn.scale.set(1, Math.max(0.5, l.y - 0.1), 1); }
      }
    });
    if (luci.matCono) luci.matCono.uniforms.colore.value.setHex(colore);
    if (ord[0] && luci.faro) {
      luci.faro.position.set(ord[0].x, ord[0].y + 0.1, ord[0].z);
      luci.faro.color.setHex(colore);
    }
  }

  /* quali stanze si disegnano: questa e quelle attaccate alle sue porte */
  function aggiornaVisibili() {
    if (S.lab) return;
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
    if (S && S.lab) {
      /* nel laboratorio: libera se la griglia ha pavimento lungo la linea */
      var nL = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.25);
      for (var iL = 1; iL <= nL; iL++) if (pavimentoLab(S.lab, x0 + (x1 - x0) * iL / nL, z0 + (z1 - z0) * iL / nL, S.labSuolo) === null) return false;
      return true;
    }
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
    /* in diagonale non si va piu' veloci; mirando si va piano */
    if (avanti && lat) { avanti *= 0.7071; lat *= 0.7071; }
    if (zoom > 0.5) v *= 0.55;
    if (S.stordito > 0) v *= 0.4;                     /* l'urlo del cervo: le gambe non rispondono */
    var vx = (-Math.sin(S.ang) * avanti - Math.cos(S.ang) * lat) * v;
    var vz = (-Math.cos(S.ang) * avanti + Math.sin(S.ang) * lat) * v;
    /* L'INERZIA: la velocita' insegue quella voluta — si parte e ci si
       ferma in un attimo, non di colpo (piu' svelti a terra che in aria) */
    S.posPrec = { x: S.pos.x, y: S.pos.y, z: S.pos.z };
    var acc = S.terra ? (avanti || lat ? 0.2 : 0.28) : 0.06;
    S.vMov = S.vMov || { x: 0, z: 0 };
    S.vMov.x += (vx - S.vMov.x) * acc; S.vMov.z += (vz - S.vMov.z) * acc;
    if (Math.abs(S.vMov.x) < 0.0004) S.vMov.x = 0;
    if (Math.abs(S.vMov.z) < 0.0004) S.vMov.z = 0;
    /* LA SCHIVATA: uno scatto di un metro e mezzo che parte forte e si
       spegne; per i primi istanti non si viene toccati */
    if (S.scatto) {
      S.vMov.x = S.scatto.x * S.scatto.k; S.vMov.z = S.scatto.z * S.scatto.k;
      S.scatto.k *= 0.86;
      if (--S.scatto.n <= 0) S.scatto = null;
    }
    var dx = S.vMov.x, dz = S.vMov.z;

    if (S.lab) muoviInLab(dx, dz);
    else {
      if (dx && puoStare(S.pos.x + dx, S.pos.z) && dentroOrda(S.pos.x + dx, S.pos.z)) S.pos.x += dx;
      if (dz && puoStare(S.pos.x, S.pos.z + dz) && dentroOrda(S.pos.x, S.pos.z + dz)) S.pos.z += dz;
    }
    S.vel.x = dx; S.vel.z = dz;

    /* il suolo: zero nei livelli; nei laboratori il pavimento della mappa
       sotto i piedi, che cambia sulle scale */
    var suolo = S.lab ? S.labSuolo : 0;
    if (tasti.salto && S.terra) { S.vel.y = 0.19; S.terra = false; bip(380, 0.06); }
    if (!S.terra) {
      S.vel.y -= 0.011;
      S.pos.y += S.vel.y;
      if (S.pos.y <= suolo) { S.pos.y = suolo; S.vel.y = 0; S.terra = true; }
    } else if (S.pos.y !== suolo) {
      /* gradini: si sale e si scende morbidi, non a scatti */
      S.pos.y += (suolo - S.pos.y) * 0.35;
      if (Math.abs(S.pos.y - suolo) < 0.004) S.pos.y = suolo;
    }

    var st = stanzaDi(S.pos.x, S.pos.z);
    passoOrda(st);
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
        if (!S.lab) { if (SPECIE_M[o.specie]) aggiornaNemicoM(o, sx, st, ora); else aggiornaNemico(o, sx, st, ora); }
      } else if (o.tipo === 'salvataggio' && o._anello) {
        if (sx !== st) return;
        var attivo = S.checkpoint && S.checkpoint.id === o.id;
        o._anello.rotation.x = Math.PI / 2 + Math.sin(ora / 900) * 0.3;
        o._anello.rotation.z += attivo ? 0.05 : 0.015;
        if (!attivo && Math.hypot(S.pos.x - (sx.x + o.x), S.pos.z - (sx.z + o.z)) < 1.6) attivaSalvataggio(o, sx);
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

  function attivaSalvataggio(o, sx) {
    S.checkpoint = { id: o.id, livello: mondo.livello.n, x: sx.x + o.x + 1.2, z: sx.z + o.z, ang: S.ang,
                     presi: Object.assign({}, S.presi), fatti: Object.assign({}, S.fatti) };
    S.vite = Math.max(S.vite, Math.min(S.vitaMax, S.vite + 1));
    salva();
    [o._lente, o._anello].forEach(function (m) { if (m) { m.material = m.material.clone(); m.material.emissive.setHex(0xffd24a); } });
    if (o._aloneS) o._aloneS.material.color.setHex(0xffd24a);
    tuttiGliOggetti(function (x) {
      if (x.tipo === 'salvataggio' && x !== o && x._lente) [x._lente, x._anello].forEach(function (m) { m.material = m.material.clone(); m.material.emissive.setHex(0x2aff7a); });
    });
    avviso(t('✚ Punto di salvataggio', '✚ Save point'), t('se cadi, riparti da qui · +1 salute', 'if you fall, you restart here · +1 health'));
    bip(784, 0.25, 'triangle', 0.07);
  }
  function danno(perche, fonte) {
    if (S.immune > 0 || S.finito) return;
    S.immune = 60;
    S.vite -= 1;
    scossa = 1;
    animV.colpito = 1;
    if (post) post.mat.uniforms.colpito.value = 1;
    if (mosse.caricando) { mosse.caricando = false; mosse.carica = 0; }
    /* da dove arriva il colpo: un arco rosso sul bordo dello schermo */
    if (fonte) {
      var ind = document.getElementById('bsiAP-dir');
      if (ind) {
        var a = Math.atan2(fonte.x - S.pos.x, fonte.z - S.pos.z) - S.ang + Math.PI;
        ind.style.transform = 'translate(-50%,-50%) rotate(' + (-a) + 'rad)';
        ind.classList.remove('on'); void ind.offsetWidth; ind.classList.add('on');
      }
    }
    bip(140, 0.25, 'sawtooth', 0.08);
    avviso(perche);
    var sc = document.getElementById('bsiAP-scena');
    if (sc) { sc.classList.remove('colpito'); void sc.offsetWidth; sc.classList.add('colpito'); }
    if (S.vite <= 0 && S.checkpoint && S.checkpoint.livello === mondo.livello.n && !S.lab) {
      /* si riparte dal punto di salvataggio: salute piena, qualche
         secondo d'immunita', i nemici restano dove sono */
      var cp = S.checkpoint;
      azzeraOrda();
      S.vite = S.vitaMax; S.immune = 180; S.energia = 100;
      S.pos.x = cp.x; S.pos.z = cp.z; S.pos.y = 0; S.vel.x = S.vel.z = 0; S.vMov = { x: 0, z: 0 }; S.posPrec = null;
      S.morti = (S.morti || 0) + 1;
      camLiscia = null; mondo.stanzaCorrente = null; aggiornaVisibili();
      avviso(t('↺ Ripartito dal punto di salvataggio', '↺ Restarted from the save point'), perche);
      bip(330, 0.4, 'sine', 0.07);
      return;
    }
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
  var PISTOLA_DX = { x: 0.03, y: 0.045, z: -0.03, ry: 0.32 }, ZERO_DX = { x: 0, y: 0, z: 0, ry: 0 };
  var BASE_SX = { x: -0.24, y: -0.46, z: -0.3, rx: 0.35, ry: -0.25, rz: -0.1 };
  var TIPO_POTERE = { Na: 'scintille', K: 'scintille', Mg: 'scintille', Fe: 'scintille', Cu: 'scintille', Zn: 'scintille',
                      Al: 'scintille', Ca: 'scintille', Ba: 'scintille', Au: 'scintille', Pb: 'scintille', U: 'scintille',
                      O: 'fiamma', H: 'fiamma', C: 'fiamma', S: 'fiamma', P: 'fiamma',
                      Cl: 'vapore', F: 'vapore', N: 'vapore', Ar: 'vapore' };
  function elementoInMano() { return !!(S && S.inMano && !ricetta(S.inMano)); }
  /* il potere della sinistra: quello scelto nella barra, o l'elemento in mano */
  function potereAttivo() {
    if (!S) return null;
    if (S.potere && S.inventario.some(function (x) { return x.sim === S.potere; })) return S.potere;
    return elementoInMano() ? S.inMano : null;
  }
  function aggiornaDispensatore() {
    var chiave = S.inMano + '|' + potereAttivo();
    if (!vista || animV.chiaveMano === chiave) return;
    var prima = animV.inMano === undefined;
    animV.inMano = S.inMano; animV.chiaveMano = chiave;
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
      /* nella pistola a capsula il composto si vede dalla capsula, che
         prende il suo colore */
      if (vista.pistola && vista.pistola.capsula) {
        var mc = vista.pistola.capsula.material;
        mc.emissive.setHex(col); mc.emissiveIntensity = r ? 0.09 : 0.02;
      }
      /* un elemento vive sulla mano sinistra; un composto nel dispensatore */
      /* la sinistra tiene il potere scelto (o l'elemento in mano) */
      var pa = potereAttivo();
      if (vista.potere) vista.potere.aggiorna(pa ? (TIPO_POTERE[pa] || 'luce') : null, pa ? ((POTERI[pa] && POTERI[pa].colore) || 0xffffff) : col);
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
    /* con la pistola del modello la destra sta piu' alta e piu' in dentro:
       si deve vedere il fianco dell'arma, non solo la capsula dall'alto */
    var P = vista.pistola ? PISTOLA_DX : ZERO_DX;
    d.position.set(BASE_DX.x + P.x + bx + animV.swayX * 0.6, BASE_DX.y + P.y + by + resp - animV.swayY * 0.5 - animV.atterra * 0.04 - cambio * 0.28 - (corsa ? 0.02 : 0),
                   BASE_DX.z + P.z + animV.rinculo * 0.05);
    /* guardare la pistola: la si alza, la si gira di fianco, la si rimette */
    var isp = animV.ispLiscia = (animV.ispLiscia || 0) + ((animV.ispeziona || 0) - (animV.ispLiscia || 0)) * 0.08;
    d.rotation.set(BASE_DX.rx + animV.rinculo * 0.25 + animV.swayY * 0.8 - cambio * 0.6 + (corsa ? -0.15 : 0) + isp * 0.25,
                   BASE_DX.ry + P.ry + animV.swayX * 1.4 + (corsa ? 0.25 : 0) + isp * 0.45, BASE_DX.rz + bx * 2 + animV.swayX + isp * 0.55);
    d.position.x -= isp * 0.06; d.position.y += isp * 0.05;
    /* il rinculo nel polso: la canna salta su e torna */
    if (vista.pistola && vista.pistola.baseX != null) vista.manoDx.rotation.x = vista.pistola.baseX + animV.rinculo * 0.18;
    /* la sinistra: di solito appena in vista in basso, si allunga a
       prendere (una curva: avanti, poi indietro) */
    var pr = Math.sin(animV.prendi * Math.PI);
    /* con un elemento in mano la sinistra si alza, col palmo in su, e lo
       tiene vivo; lanciandolo spinge in avanti */
    var vuoleAlta = potereAttivo() ? 1 : 0;
    animV.alta = (animV.alta || 0) + (vuoleAlta - (animV.alta || 0)) * 0.1;
    animV.lancio = Math.max(0, (animV.lancio || 0) - 0.06);
    var al = animV.alta, la = Math.sin(Math.min(1, animV.lancio) * Math.PI);
    var e = vista.sx;
    /* la mano del modello e' aperta e dritta, non raccolta come quella
       procedurale: per mostrare il palmo il polso si piega di piu' */
    var alM = vista.modello ? al : 0;
    e.position.set(BASE_SX.x - bx + animV.swayX * 0.6 + pr * 0.16 + al * 0.1 + la * 0.05,
                   BASE_SX.y - by * 0.8 + resp + pr * 0.3 - animV.atterra * 0.04 + al * 0.31 + la * 0.04,
                   BASE_SX.z - pr * 0.2 - al * 0.06 - la * 0.16);
    e.rotation.set(BASE_SX.rx - pr * 0.3 - al * 0.55 - la * 0.3, BASE_SX.ry + animV.swayX * 1.2 + pr * 0.25 + al * 0.35,
                   BASE_SX.rz - bx * 2 + al * 0.15);
    if (vista.manoSx) {
      /* il palmo si gira verso l'alto e il polso si piega all'indietro, cosi'
         la mano esce dalla manica e mostra il palmo, come chi regge qualcosa */
      vista.manoSx.rotation.z = al * Math.PI * 0.82;
      vista.manoSx.rotation.x = al * 0.55 + alM * 0.45;
      vista.manoSx.position.z = -al * 0.02;
    }
    if (vista.potere) vista.potere.anima(ora, al * (1 + la * 1.5 + mosse.carica * 2.2));
    if (vista.rig && vista.rig.aggancio) animaRig(ora, al);
    else if (vista.modello) poseMani(ora, pr, al, la, cambio);
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
  /* LE POSE DELLE MANI DEL MODELLO. La destra impugna: il medio,
     l'anulare e il mignolo chiusi intorno all'impugnatura, il pollice che
     si chiude da dietro, l'indice piu' aperto sul grilletto, che si chiude
     di colpo quando si spruzza. La sinistra: rilassata, un po' piegata;
     si chiude a prendere; col potere si apre e le dita respirano; ferma a
     lungo, ripete il gesto della clip (il pugno che si apre, le dita che si
     stirano) */
  /* LE BRACCIA DEL RIG IN GIOCO. Le animazioni seguono quello che succede:
     il passo e la corsa, Equip quando si cambia quello che si ha in mano,
     il jab sinistro (Punch, solo il braccio sinistro) per lanciare un
     elemento e per prendere, e da fermi a lungo Inspect sul sinistro: si
     guarda la mano robotica. Lo sguardo che gira trascina un poco le braccia, lo
     spruzzo le fa rinculare */
  function animaRig(ora, al) {
    var R = vista.rig;
    var dt = Math.min(0.05, Math.max(0.001, ora - (animV.oraRig || ora - 0.016)));
    animV.oraRig = ora;
    var vel = Math.hypot(S.vel.x, S.vel.z);
    var e = animV.eventiRig || (animV.eventiRig = { cambio: 0, lancio: 0, prendi: 0 });
    if (animV.cambio > 0.9 && e.cambio <= 0.9) R.colpo('Equip', 1.5);
    /* il jab sinistro (Punch, solo il braccio sinistro: Punch_2 e' il
       destro e la destra tiene la pistola) per lanciare e per allungarsi a
       prendere */
    if (animV.lancio > 0.9 && e.lancio <= 0.9) R.colpo('Punch_sx', 1.5);
    if (animV.prendi > 0.9 && e.prendi <= 0.9) R.colpo('Punch_sx', 1.1);
    e.cambio = animV.cambio; e.lancio = animV.lancio || 0; e.prendi = animV.prendi;
    var fermo = vel < 0.004 && !animV.prendi && al < 0.05;
    animV.fermoDa = fermo ? (animV.fermoDa || ora) : 0;
    if (animV.fermoDa && ora - animV.fermoDa > 8 && !R.colpi.Inspect_sx) { R.colpo('Inspect_sx', 1); animV.fermoDa = ora + 4; }
    R.aggiorna({ dt: dt, ora: ora, vel: Math.min(1, vel / 0.05), corsa: vel > 0.07, potere: al,
                 prendi: animV.prendi > 0 ? 1 - animV.prendi : -1 });
    /* le dita della mano robotica copiano quelle della sinistra del rig:
       il pugno in guardia, la mano aperta dell'ispezione e del potere, la
       presa, il jab del lancio — sono le animazioni del modello. Una molla
       svelta toglie solo gli scatti fra un fotogramma e l'altro */
    if (R.robotDita && R.chiusuraSx) {
      G.pieghaRobot(R, molle('robot', R.chiusuraSx(), dt, { pollice: 4, indice: 4, medio: 4, anulare: 4, mignolo: 4 }));
    }
    /* lo sguardo e il rinculo */
    R.base.rotation.set(animV.swayY * 0.6 + animV.rinculo * 0.05 - animV.colpito * 0.22, animV.swayX * 0.9, animV.swayX * 0.4 + animV.colpito * 0.12);
    animV.colpito = Math.max(0, (animV.colpito || 0) - dt * 3);
    /* mirando le braccia scendono e si allargano: il centro resta libero */
    R.base.position.set(animV.swayX * 0.25 + zoom * 0.05, -animV.atterra * 0.03 - zoom * 0.09, animV.rinculo * 0.025 + zoom * 0.04);
    /* il potere sul palmo */
    if (vista.potere && vista.potere.palmo && al > 0.01) {
      var pp = new T.Vector3(), nn = new T.Vector3();
      R.base.updateMatrixWorld(true);
      G.palmoSx(R, pp, nn);
      if (!R.robot && nn.z < 0) nn.negate();
      orientaPalmo(vista.potere.palmo, pp, nn);
    }
  }
  /* OGNI DITO HA LA SUA INERZIA. Le pose non si applicano di colpo: ogni
     dito insegue il suo bersaglio con una molla smorzata (rigidezza
     diversa per dito: l'indice sul grilletto e' svelto, il mignolo pigro),
     cosi' un cambio di posa e' un movimento e non uno scatto. Sopra ci
     sono i micro-movimenti di una mano viva: ogni dito ha la sua fase */
  var DITA5 = ['pollice', 'indice', 'medio', 'anulare', 'mignolo'];
  var RIGIDO = { pollice: 140, indice: 220, medio: 120, anulare: 105, mignolo: 90 };
  function molle(lato, bersaglio, dt, svelto) {
    var st = animV.dita || (animV.dita = {});
    var m = st[lato] || (st[lato] = {});
    var out = {};
    DITA5.forEach(function (d) {
      var c = m[d] || (m[d] = { x: bersaglio[d], v: 0 });
      var k = RIGIDO[d] * ((svelto && svelto[d]) || 1), z = 2 * Math.sqrt(k);
      c.v += (k * (bersaglio[d] - c.x) - z * c.v) * dt;
      c.x += c.v * dt;
      out[d] = c.x;
    });
    return out;
  }
  /* il potere sta sopra il palmo: l'aura si mette sul palmo, col suo «su»
     (l'asse -y, quello verso cui salgono fiamma, vapore e nucleo) lungo la
     normale del palmo, un po' piegato verso lo sguardo */
  var qPal = null, qPad = null, vGiu = null;
  function orientaPalmo(aura, pos, norm) {
    if (!vGiu) { vGiu = new T.Vector3(0, -1, 0); qPal = new T.Quaternion(); qPad = new T.Quaternion(); }
    var su = norm.clone().add(new T.Vector3(0, 0.6, 0.25)).normalize();
    aura.parent.updateWorldMatrix(true, false);
    aura.position.copy(aura.parent.worldToLocal(pos.clone().addScaledVector(norm, 0.012)));
    qPal.setFromUnitVectors(vGiu, su);
    aura.parent.getWorldQuaternion(qPad);
    aura.quaternion.copy(qPad.invert().multiply(qPal));
  }
  function poseMani(ora, pr, al, la, cambio) {
    var mm = vista.modello;
    var dt = Math.min(0.05, Math.max(0.001, ora - (animV.oraMani || ora - 0.016)));
    animV.oraMani = ora;
    var vel = Math.hypot(S.vel.x, S.vel.z), corsa = vel > 0.07;
    /* la destra: la presa, con l'indice sul grilletto. Spruzzando l'indice
       preme di scatto e rilascia piu' morbido */
    var preme = animV.rinculo > 0.35 ? 1 : 0;
    var apri = Math.sin(Math.min(1, animV.cambio) * Math.PI) * 0.55;
    var micro = function (f, a) { return Math.sin(ora * (1.1 + f * 0.37) + f * 1.7) * a; };
    var bDx = {
      pollice: PRESA.pollice - apri + micro(0, 0.02),
      indice: PRESA.indice + preme * 0.5 - apri + micro(1, 0.03),
      medio: PRESA.medio - apri + (corsa ? 0.05 : 0),
      anulare: PRESA.anulare - apri + micro(3, 0.015),
      mignolo: PRESA.mignolo - apri + micro(4, 0.02)
    };
    var wDx = molle('dx', bDx, dt, { indice: preme ? 4 : 1 });
    mm.posa(1, wDx);
    animV.grilletto = Math.max(0, Math.min(1, (wDx.indice - PRESA.indice) / 0.5));
    /* il grilletto della pistola segue l'indice */
    if (vista.pistola && vista.pistola.grilletto) {
      var gri = vista.pistola.grilletto;
      if (gri.userData.z0 == null) gri.userData.z0 = gri.position.x;
      gri.position.x = gri.userData.z0 + animV.grilletto * 7;
    }
    /* il potere si accende sul palmo vero */
    if (vista.potere && vista.potere.palmo) {
      var pp = new T.Vector3(), nn = new T.Vector3();
      mm.palmo(-1, pp, nn);
      orientaPalmo(vista.potere.palmo, pp, nn);
    }
    /* la sinistra */
    var resp = Math.sin(ora * 1.3) * 0.04;
    var bSx = {};
    var u = animV.prendi > 0 ? 1 - animV.prendi : -1;          /* 0 → 1 lungo il gesto di prendere */
    DITA5.forEach(function (d, i) {
      var b = 0.24 + i * 0.03 + resp + micro(i + 5, 0.025) + (corsa ? 0.14 : 0);
      if (al > 0.05) {
        /* il potere: la mano aperta, e le dita che ondeggiano una dopo
           l'altra, come qualcosa di vivo sul palmo */
        b = b * (1 - al) + al * (0.08 + 0.13 * (0.5 + 0.5 * Math.sin(ora * 2.4 - i * 0.8)));
      }
      if (u >= 0) {
        /* prendere: prima si apre, poi si chiude sull'oggetto, poi lascia */
        b = u < 0.3 ? -0.2 : u < 0.75 ? 0.8 + (i === 0 ? -0.15 : 0) : b;
      }
      if (la > 0.05) b = b * (1 - la) - 0.28 * la;            /* il lancio: le dita si aprono di scatto */
      bSx[d] = b;
    });
    var wSx = molle('sx', bSx, dt, la > 0.05 ? { pollice: 3, indice: 3, medio: 3, anulare: 3, mignolo: 3 } : null);
    var fermo = vel < 0.004 && pr < 0.01 && al < 0.05;
    animV.fermoDa = fermo ? (animV.fermoDa || ora) : 0;
    var gesto = null;
    animV.ispeziona = 0;
    if (animV.fermoDa && ora - animV.fermoDa > 7) {
      var tg = (ora - animV.fermoDa - 7) % 11;
      if (tg < 2.6) gesto = { t: 11.0 + tg * 0.85, peso: Math.sin(tg / 2.6 * Math.PI) * 0.9 };
      /* e la destra, ogni tanto, alza la pistola per guardarla */
      if (tg > 4 && tg < 7.5) animV.ispeziona = Math.sin((tg - 4) / 3.5 * Math.PI);
    }
    mm.posa(-1, wSx, gesto);
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
    var sole = new T.DirectionalLight(0xfff2e0, ps1() ? 0.6 : 1.15);
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
    caricaManiModello(vista);
  }

  /* I MODELLI DELLA PRIMA PERSONA (cartella models/, preparati da
     tools/prepara-modelli.js): le mani con la loro animazione, la manica
     del camice dalla scansione, la pistola a capsula. Si scaricano una
     volta e si ricostruiscono a ogni vista nuova; finche' non arrivano, o
     se non arrivano (offline al primo avvio), restano i pezzi procedurali.
     La presa si monta quando ci sono sia le mani sia la pistola */
  var MODELLI_FP = { braccia: 'models/braccia-atomic.glb', pistola: 'models/pistola-atomic.glb', mani: 'models/mani-atomic.glb', manica: 'models/manica-atomic.glb' };
  var PRESA = { pollice: 0.55, indice: 0.42, medio: 0.8, anulare: 0.83, mignolo: 0.86 };
  var bufferFP = {};
  function libreriaGLTF() {
    return new Promise(function (ok) {
      if (T.GLTFLoader) return ok(true);
      var sc = document.createElement('script'); sc.src = './gltf_loader.js';
      sc.onload = function () { ok(!!T.GLTFLoader); }; sc.onerror = function () { ok(false); };
      document.head.appendChild(sc);
    });
  }
  function scaricaFP(k) {
    if (!bufferFP[k]) {
      bufferFP[k] = libreriaGLTF().then(function (c) {
        if (!c) throw new Error('GLTFLoader assente');
        return fetch(MODELLI_FP[k]);
      }).then(function (r) { if (!r.ok) throw new Error(MODELLI_FP[k] + ' HTTP ' + r.status); return r.arrayBuffer(); })
        .catch(function (e) { bufferFP[k] = null; animV.erroreMani = String(e && e.message || e); return null; });
    }
    return bufferFP[k];
  }
  /* prima le braccia del rig e la pistola; le mani e la manica separate
     sono la riserva, se il rig non arriva */
  function caricaManiModello(v) {
    if (typeof fetch === 'undefined' || !G.maniModello) return;
    animV.modelliFP = 0;
    function carica(k) {
      return scaricaFP(k).then(function (b) {
        if (!b || vista !== v) return null;
        return new Promise(function (ok) {
          new T.GLTFLoader().parse(b.slice(0), '', function (gltf) { ok(vista === v ? gltf : null); },
            function (e) { animV.erroreMani = String(e && e.message || e); ok(null); });
        });
      });
    }
    function montaRig() {
      if (!v.rig || !v.pistola || v.rig.aggancio) return;
      /* il rig e' fatto per un campo visivo largo, quello dei giochi in
         prima persona: con i 52 gradi delle braccia procedurali i pugni
         starebbero sotto il bordo */
      camMani.fov = 72; camMani.updateProjectionMatrix();
      G.pistolaNelRig(v.rig, v);
      /* le braccia procedurali e le mani separate non servono piu' */
      v.dx.visible = false; v.sx.visible = false;
      if (v.potere && v.potere.palmo) v.gruppo.attach(v.potere.palmo);
      animV.inMano = undefined;
    }
    /* le due mani sono quelle del rig, tutte e due in guanto di nitrile:
       la sinistra e' lo specchio vero della destra (la mano robotica non
       c'e' piu') */
    Promise.all([carica('braccia'), carica('pistola')]).then(function (r) {
      if (vista !== v) return;
      if (r[1]) { v.pistola = G.pistolaModello(r[1], v); animV.modelliFP++; }
      if (r[0]) { v.rig = G.bracciaRig(r[0], v); if (v.rig) animV.modelliFP++; }
      if (v.rig) { montaRig(); return; }
      /* la riserva: le mani e la manica */
      ['mani', 'manica'].forEach(function (k) {
        carica(k).then(function (gltf) {
          if (!gltf || vista !== v) return;
          if (k === 'mani') v.modello = G.maniModello(gltf, v);
          else v.manicaModello = G.manicaModello(gltf, v);
          animV.modelliFP++;
          if (v.modello && v.pistola && !v.pistola.baseX) {
            G.adattaPresa(v, PRESA);
            v.pistola.baseX = v.manoDx.rotation.x;
            animV.inMano = undefined;
          }
        });
      });
    });
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
      /* le mosse muovono la testa: la schivata la inclina e la abbassa,
         il colpo pesante e l'esecuzione la spingono avanti */
      var aff = mosse.affondo;
      camera.position.set(S.pos.x + sx + Math.cos(S.ang) * bobX - Math.sin(S.ang) * aff, S.pos.y + 1.62 + sy + bobY - mosse.chino * 0.22,
                          S.pos.z - Math.sin(S.ang) * bobX - Math.cos(S.ang) * aff);
      camera.rotation.set(S.angY - aff * 0.25, S.ang, -bobX * 0.6 + (tasti.latSx ? 0.012 : 0) - (tasti.latDx ? 0.012 : 0) + mosse.rollio, 'YXZ');
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
    if (luci && luci.torcia) {
      var tc = luci.torcia, dv = camera.getWorldDirection(new T.Vector3());
      if (!luci.dirTorcia) luci.dirTorcia = dv.clone();
      luci.dirTorcia.lerp(dv, 0.22).normalize();
      tc.position.copy(camera.position).add(new T.Vector3(Math.cos(S.ang) * 0.22, -0.25, -Math.sin(S.ang) * 0.22));
      tc.target.position.copy(tc.position).addScaledVector(luci.dirTorcia, 6);
      var ora2 = Date.now();
      tc.intensity = (prima ? 1.8 : 1.2) * (Math.sin(ora2 / 37) > 0.995 || ((ora2 / 1000) % 23) < 0.12 ? 0.35 : 1);
    }
    if (luci && luci.punti) {
      /* i neon guasti: accesi quasi sempre, poi un buco di qualche
         fotogramma, a volte due di fila — mai a ritmo */
      luci.punti.forEach(function (p, i) {
        var u = p.userData;
        if (!u.sfarfalla) { if (u.base != null && p.intensity !== u.base) p.intensity = u.base; return; }
        if (u.buio > 0) u.buio--; else if (Math.random() < 0.035) u.buio = 2 + (Math.random() * 7 | 0);
        p.intensity = (u.base || 0) * (u.buio > 0 ? 0.08 : 0.9 + Math.random() * 0.1);
        if (luci.coni && luci.coni[i]) luci.coni[i].material.opacity = 1;
      });
    }
    if (luci && luci.allarme && mondo) {
      var stA = mondo.stanzaCorrente, oraA = Date.now() / 1000;
      if (stA && !S.lab && (stA._allarme || S.orda === stA)) {
        luci.allarme.position.set(stA.x + stA.larg / 2 - 0.5 + Math.cos(oraA * 3.2) * 0.4, (stA.alt || 3.2) - 0.35, stA.z - stA.prof / 2 + 0.5 + Math.sin(oraA * 3.2) * 0.4);
        luci.allarme.intensity = (S.orda === stA ? 3.2 : 1.4) * Math.pow(0.5 + 0.5 * Math.sin(oraA * 3.2), 2);
      } else luci.allarme.intensity = 0;
    }
    if (luci && luci.polvere) {
      /* la polvere: si sposta con chi guarda (i granelli che escono da un
         lato rientrano dall'altro), scende e gira piano */
      var pa = luci.polvere.geometry.attributes.position, A2 = pa.array, oraP = Date.now() / 1000;
      var cx2 = camera.position.x, cz2 = camera.position.z, base2 = S.lab ? S.labSuolo : 0;
      for (var q2 = 0; q2 < A2.length; q2 += 3) {
        A2[q2] += Math.sin(oraP * 0.3 + q2) * 0.0008; A2[q2 + 1] -= 0.0012; A2[q2 + 2] += Math.cos(oraP * 0.27 + q2 * 0.7) * 0.0008;
        if (A2[q2] - cx2 > 4.5) A2[q2] -= 9; else if (A2[q2] - cx2 < -4.5) A2[q2] += 9;
        if (A2[q2 + 2] - cz2 > 4.5) A2[q2 + 2] -= 9; else if (A2[q2 + 2] - cz2 < -4.5) A2[q2 + 2] += 9;
        if (A2[q2 + 1] < base2) A2[q2 + 1] += 3.4; else if (A2[q2 + 1] > base2 + 3.4) A2[q2 + 1] -= 3.4;
      }
      pa.needsUpdate = true;
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     INTERAGIRE

     Quello che si puo' toccare e' quello che si ha DAVANTI e VICINO: si
     calcola, non si indovina, e si scrive sullo schermo che cosa succede
     premendo.
     ═════════════════════════════════════════════════════════════════════════ */
  function bersaglio() {
    if (!S || !mondo) return null;
    if (S.lab) {
      /* nel laboratorio: il banco e la porta, in coordinate del mondo */
      var miL = null, mdL = 99;
      S.lab.oggetti.forEach(function (o) {
        var vx = o.x - S.pos.x, vz = o.z - S.pos.z, d = Math.hypot(vx, vz);
        if (d >= 2.0) return;
        var dot = d > 0.05 ? (-Math.sin(S.ang) * vx - Math.cos(S.ang) * vz) / d : 1;
        var peso = d + (1 - dot) * 0.7;
        if (peso < mdL) { mdL = peso; miL = o; }
      });
      return miL;
    }
    var st = stanzaDi(S.pos.x, S.pos.z);
    if (!st) return null;
    var mi = null, md = 99;
    (st.oggetti || []).forEach(function (o) {
      if (o.preso || o.abbattuto) return;
      if (['elemento', 'foglio', 'banco', 'terminale', 'uscita', 'registratore', 'portaLab'].indexOf(o.tipo) < 0) return;
      if (o.tipo === 'registratore' && o.ascoltato) return;
      var vx = (st.x + o.x) - S.pos.x, vz = (st.z + o.z) - S.pos.z;
      var d = Math.hypot(vx, vz);
      if (o.tipo === 'banco') d -= 0.8;
      if (o.tipo === 'portaLab') d -= 0.3;
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
    else if (o.tipo === 'portaLab') entraLab(o, stanzaDi(S.pos.x, S.pos.z));
    else if (o.tipo === 'uscitaLab') esciLab();
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
    if (!S.potere) S.potere = sim;
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
    S.checkpoint = null;
    /* la fine di un atto: lo si dice */
    if (n % 100 === 0 && n < LIV().LIVELLI) S.finito.atto = Math.floor(n / 100) + 1;
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
      /* il colpo a segno: il mirino si apre in una croce; giallo se debole */
      '#bsiAP-mirino.colpo{animation:apColpo .22s ease-out}',
      '#bsiAP-esegui{position:absolute;left:50%;top:calc(50% + 26px);transform:translateX(-50%);z-index:6;pointer-events:none;display:none;',
      'font:900 12px/1 system-ui,sans-serif;letter-spacing:.14em;color:#ffe9c4;padding:5px 9px;border:1px solid rgba(255,80,60,.8);',
      'background:rgba(60,0,0,.55);text-shadow:0 0 6px #ff3020;animation:apEsegui .5s ease-in-out infinite alternate}',
      '@keyframes apEsegui{from{opacity:.65}to{opacity:1}}',
      '#bsiAP-mirino.colpo.forte{box-shadow:0 0 0 3px #ffd24a,0 0 14px #ffd24a}',
      '@keyframes apColpo{0%{transform:scale(2.4) rotate(45deg);box-shadow:0 0 0 2px #fff}100%{transform:none}}',
      '#bsiAP-scena.mira #bsiAP-mirino{width:3px;height:3px;margin:-1.5px 0 0 -1.5px;box-shadow:0 0 0 7px rgba(255,255,255,.12),0 0 0 8px rgba(255,255,255,.5)}',
      '#bsiAP-scena.mira::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:3;',
      ' background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.55) 100%)}',
      '#bsiAP-dir{position:absolute;left:50%;top:50%;width:46vmin;height:46vmin;border-radius:50%;opacity:0;pointer-events:none;',
      ' border-top:6px solid rgba(255,40,30,.85);filter:drop-shadow(0 0 8px #f20);transform:translate(-50%,-50%)}',
      '#bsiAP-dir.on{animation:apDir .9s ease-out}',
      '@keyframes apDir{0%{opacity:1}100%{opacity:0}}',
      '.bsiAP-num{position:absolute;left:0;top:0;z-index:6;pointer-events:none;font:900 18px system-ui,sans-serif;',
      ' text-shadow:0 0 4px #000,0 2px 0 #000;will-change:transform,opacity}',
      '#bsiAP-hud .bers{position:absolute;left:50%;top:44px;transform:translateX(-50%);min-width:180px;',
      ' text-align:center;font:600 12px system-ui,sans-serif;color:#ffd9c8;text-shadow:0 1px 2px #000}',
      '#bsiAP-hud .bers:empty{display:none}',
      '#bsiAP-hud .bers b{color:#ffd24a}',
      '#bsiAP-hud .bers .bb{height:5px;background:rgba(0,0,0,.6);border:1px solid #6a2a20;border-radius:3px;margin-top:3px;overflow:hidden}',
      '#bsiAP-hud .bers .bb i{display:block;height:100%;background:linear-gradient(90deg,#ff4d3a,#ff9a4d)}',
      '#bsiAP-hud .poteri{position:absolute;left:50%;bottom:30px;transform:translateX(-50%);display:flex;gap:5px;pointer-events:auto}',
      '.bsiAP-pt{position:relative;width:38px;height:38px;border-radius:50%;border:2px solid var(--c);',
      ' background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.25),rgba(8,14,20,.92) 60%);',
      ' color:#fff;font:800 13px system-ui,sans-serif;cursor:pointer;touch-action:none;',
      ' box-shadow:0 0 8px var(--c);opacity:.72;transition:transform .12s,opacity .12s}',
      '.bsiAP-pt i{position:absolute;top:-5px;left:-3px;font:700 9px system-ui;font-style:normal;color:#cfe2f5;',
      ' background:#0b1a26;border-radius:6px;padding:0 3px}',
      '.bsiAP-pt.sel{opacity:1;transform:scale(1.18);box-shadow:0 0 16px var(--c),inset 0 0 10px var(--c)}',
      '.bsiAP-pt.scarico{filter:grayscale(.8) brightness(.6)}',
      '#bsiAP-hud .barra.energia{width:120px;height:7px}',
      '#bsiAP-hud .barra.energia b{display:block;height:100%;border-radius:1px;transition:width .2s;',
      ' background:linear-gradient(90deg,#7a4dff,#3ee0ff);box-shadow:0 0 6px rgba(120,80,255,.6)}',
      '#bsiAP-hud .scudo{color:#ffd24a;text-shadow:0 0 6px #ffd24a}',
      '.bsiAP-t.fuoco{background:radial-gradient(circle,#5a1c14,#2a0c08);border-color:#ff6a3a;color:#ffb08a}',
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
        '<div id="bsiAP-mirino"></div><div id="bsiAP-esegui">' + t('V · ☠ ESECUZIONE', 'V · ☠ EXECUTE') + '</div>' +
        '<div class="bers" id="apH-bers"></div>' +
        '<div id="bsiAP-dir"></div>' +
        '<div class="poteri" id="apH-poteri"></div>' +
        '<div class="basso" id="apH-basso"></div>';
      hudPrec = {};
      /* la barra dei poteri: un tocco sceglie */
      h.addEventListener('pointerdown', function (ev) {
        var b3 = ev.target.closest('[data-pot]');
        if (!b3) return;
        ev.preventDefault(); ev.stopPropagation();
        scegliPotere(b3.getAttribute('data-pot'));
      });
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
             : b.tipo === 'portaLab' ? t('✋ entra nel laboratorio', '✋ enter the laboratory')
             : b.tipo === 'uscitaLab' ? t('✋ torna al livello', '✋ back to the level')
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
               Math.round(dosi * 100) + '%"></b></span>' +
               '<span class="barra energia" role="img" aria-label="' + t('energia ', 'energy ') + Math.round(S.energia || 0) + '"><b style="width:' +
               Math.round(S.energia == null ? 100 : S.energia) + '%"></b></span>' + (S.scudo > 0 ? ' <span class="scudo">🛡</span>' : '');
      })(),
      dove: '<small>' + esc(t('LIVELLO ', 'LEVEL ') + mondo.livello.n + ' · ' +
            String(mondo.ala.nome).split('·')[0]) + '</small>' +
            esc(S.lab ? (NOMI_LAB[S.lab.nome] ? t(NOMI_LAB[S.lab.nome][0], NOMI_LAB[S.lab.nome][1]) : S.lab.nome) : (st ? st.nome : '')),
      punti: String(S.punti).padStart(6, '0') + (S.uccisi ? ' <small>☠ ' + S.uccisi + '</small>' : ''),
      poteri: S.lab ? '' : barraPoteri(),
      bers: (function () {
        var n = S.lab ? null : nelMirino(16);
        if (!n || !n.o) return '';
        var sp = specieDi(n.o), en = lingua() === 'en' ? 1 : 0;
        var id = S.inMano && ricetta(S.inMano) ? S.inMano : potereAttivo();
        var debole = id && moltiplicatore(n.o, id) > 1;
        return esc(sp.nome[en]) + (debole ? ' <b>' + t('· debole a ', '· weak to ') + esc(id) + '</b>' : '') +
               '<div class="bb"><i style="width:' + Math.round(100 * Math.max(0, n.o.vita) / sp.vita) + '%"></i></div>';
      })(),
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
    if ((S.t || 0) % 6 === 0) {
      var es = document.getElementById('bsiAP-esegui');
      if (es) es.style.display = IMP.visuale === 'prima' && !mosse.esegui && bersaglioEsecuzione() ? 'block' : 'none';
    }
    if ((S.t || 0) % 10 === 0) mappa();
    aggiornaNastro();
  }

  /* la mappa del laboratorio: il pavimento percorribile intorno al
     chimico (16 m di lato), il banco e la porta */
  function mappaLab(q) {
    var L = S.lab, g = L.griglia, R = 8, sc = 176 / (2 * R);
    q.clearRect(0, 0, 192, 192);
    q.fillStyle = 'rgba(143,227,196,.22)';
    for (var a = -R; a < R; a += 0.5) for (var b2 = -R; b2 < R; b2 += 0.5) {
      if (pavimentoLab(L, S.pos.x + a, S.pos.z + b2, S.labSuolo) !== null) q.fillRect(8 + (a + R) * sc, 8 + (b2 + R) * sc, sc * 0.5 + 0.5, sc * 0.5 + 0.5);
    }
    L.oggetti.forEach(function (o) {
      var x = 8 + (o.x - S.pos.x + R) * sc, z = 8 + (o.z - S.pos.z + R) * sc;
      if (x < 4 || z < 4 || x > 188 || z > 188) return;
      q.fillStyle = o.tipo === 'banco' ? '#5ef0c4' : '#2aff7a';
      q.beginPath(); q.arc(x, z, 4, 0, 6.2832); q.fill();
    });
    q.save(); q.translate(96, 96); q.rotate(-S.ang);
    q.fillStyle = '#ffffff'; q.beginPath(); q.moveTo(0, -7); q.lineTo(5, 5); q.lineTo(-5, 5); q.closePath(); q.fill();
    q.restore();
  }
  /* la mappa: solo le stanze gia' viste, come su un taccuino */
  function mappa() {
    var cv = document.getElementById('bsiAP-mappa');
    if (!cv || !mondo) return;
    var q = cv.getContext('2d');
    if (S.lab) { mappaLab(q); return; }
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
                : o.tipo === 'elemento' ? '#ffd24a' : o.tipo === 'terminale' ? '#5ef0c4'
                : o.tipo === 'portaLab' ? '#c9a24a' : null;
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
      /* tre atti: si vede quello in cui si e' arrivati, gli altri si
         aprono con un tocco sul titolo */
      var attoMax = Math.ceil(max / 100), aperto = attoAperto || attoMax;
      [1, 2, 3].forEach(function (at) {
        h += '<button class="bsiAP-b" data-atto="' + at + '" style="margin-top:8px;text-align:left">' +
             (at === aperto ? '▾ ' : '▸ ') + esc(LIV().NOMI_ATTI()[at]) + (at > attoMax ? ' 🔒' : '') + '</button>';
        if (at !== aperto) return;
      LIV().ZONE().forEach(function (z) {
        var z2 = LIV().zonaDi((at - 1) * 100 + z.n * 10);
        h += '<div class="bsiAP-sub" style="margin:6px 0 0"><b style="color:#8fe3c4">' +
             esc(z2.nome) + '</b></div><div class="bsiAP-liv">';
        var PZ = LIV().PER_ZONA, base = (at - 1) * 100;
        for (var n = base + (z.n - 1) * PZ + 1; n <= base + z.n * PZ; n++) {
          var b2 = Gd[n];
          h += '<button data-liv="' + n + '"' + (b2 ? ' class="boss"' : '') +
               (n > max ? ' disabled' : '') + '>' + (n > max ? '🔒 ' : '') + n +
               (b2 ? '<br><small>☠ ' + esc(b2.nome) + '</small>' : '') + '</button>';
        }
        h += '</div>';
      });
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
      [].forEach.call(u.querySelectorAll('[data-atto]'), function (b4) {
        b4.onclick = function () { attoAperto = +b4.getAttribute('data-atto'); disegnaUI(); };
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
        gruppo(t('Istituto', 'Institute'), 'degrado',
               [['si', t('abbandonato', 'abandoned')], ['no', t('in ordine', 'tidy')]]) +
        gruppo(t('Sangue', 'Blood'), 'sangue',
               [['si', t('sì', 'yes')], ['ridotto', t('ridotto', 'reduced')]]) +
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
        /* i modelli 3D della prima persona e i loro autori: la CC-BY chiede
           il credito dove l'opera si usa */
        '<div class="bsiAP-sub">' + t('Modelli 3D', '3D models') + '</div>' +
        '<div class="bsiAP-sub" style="text-align:left;font-size:12px">' +
          '• «Fists (2023) | First Person Animations» — 1Matzh (Sketchfab, CC-BY 4.0)<br>' +
          '• «Robotic Hand» — SeanNicolas (Sketchfab, CC-BY 4.0)<br>' +
          '• «hands animation» — hugo colauto (Sketchfab, Sketchfab Standard)<br>' +
          '• «Modern Scientist in a Lab Coat» — restore50 (Sketchfab, CC-BY 4.0)<br>' +
          '• «Capsule Gun» — sc8di (Sketchfab, CC-BY 4.0)<br>' +
          '• «Worm Monster» — CR!STALLL (Sketchfab, CC-BY 4.0)<br>' +
          '• «Scary Monster» — L. (Sketchfab, Sketchfab Standard)<br>' +
          '• «SWAMP MONSTER» — alexalbinyana (Sketchfab, CC-BY 4.0)<br>' +
          '• «The Human Deer» — ceeleste (Sketchfab, CC-BY 4.0)<br>' +
          '• «6- Stylized- Monster» — Lex Wild (Sketchfab, CC-BY 4.0)<br>' +
          '• «Monster» — itszyx123456789 (Sketchfab, CC-BY 4.0)<br>' +
          '• «CREATURE MONSTER 3D BY Oscar Creativo» — OSCAR CREATIVO (Sketchfab, CC-BY 4.0)<br>' +
          '• «Small Lab» — Biohazard Rooms (Sketchfab, CC-BY 4.0)<br>' +
          '• «Sci-fi lab» — Agata Wilczek (Sketchfab, CC-BY 4.0)<br>' +
          '• «Flynn\'s Secret Lab [Tron Legacy]» — jvouillon (Sketchfab, CC-BY 4.0)<br>' +
          '• «Location underground laboratory» — bazz4r (Sketchfab, CC-BY 4.0)<br>' +
          '• «Overgrown Laboratory» — MichalTroye (Sketchfab, CC-BY 4.0)<br>' +
          '• «Quantum_Laboratory_X_Alpha» — -X-ScornGames (Sketchfab, CC-BY 4.0)<br>' +
          '• «Sci Fi lab» — IrisProcess (Sketchfab, CC-BY 4.0)<br>' +
          t('adattati: camice e guanto di nitrile, mano robotica specchiata, scheletro snellito, texture ridotte', 'adapted: lab coat and nitrile glove, mirrored robotic hand, slimmed skeleton, reduced textures') +
        '</div>' +
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
        titolo = F.atto ? t('ATTO ', 'ACT ') + ['', 'I', 'II', 'III'][F.atto - 1] + t(' CONCLUSO', ' COMPLETE')
                        : t('LIVELLO ', 'LEVEL ') + F.livello + t(' COMPLETATO', ' COMPLETE');
        var prossimo = LIV().livello(S.livello);
        testo = (F.atto ? LIV().NOMI_ATTI()[F.atto] + t(' comincia. Il Protocollo ha ricostruito l’istituto.\n\n', ' begins. The Protocol has rebuilt the institute.\n\n') : '') +
                t('Salvato. Prossimo: ', 'Saved. Next: ') + prossimo.nome +
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

  /* LO ZOOM (la mira): il campo visivo si stringe con una curva morbida,
     lo sguardo diventa piu' preciso, ci si muove piu' piano */
  var zoom = 0, zoomVoluto = 0, FOV_BASE = null;
  function cambiaZoom(v) {
    zoomVoluto = v == null ? (zoomVoluto ? 0 : 1) : v;
    var b2 = document.getElementById('apB-zoom'); if (b2) b2.classList.toggle('giu', !!zoomVoluto);
    var sc = document.getElementById('bsiAP-scena'); if (sc) sc.classList.toggle('mira', !!zoomVoluto);
  }
  function aggiornaZoom(dt) {
    if (!camera) return;
    if (FOV_BASE == null || FOV_BASE.cam !== camera) FOV_BASE = { cam: camera, fov: camera.fov };
    zoom += (zoomVoluto - zoom) * Math.min(1, dt * 12);
    var f = FOV_BASE.fov * (1 - zoom * 0.45) * (1 + mosse.fov * 0.12);
    if (Math.abs(camera.fov - f) > 0.01) { camera.fov = f; camera.updateProjectionMatrix(); }
  }
  /* LO SCHERMO INTERO: la scena del gioco riempie lo schermo (con l'API
     del browser dove c'e'; su iPhone, che non la ha, la sola scena fissata
     a tutto schermo) */
  function schermoIntero(v) {
    var dentro = document.body.classList.contains('bsiAP-pieno');
    var vuole = v == null ? !dentro : v;
    var el = document.documentElement;
    if (vuole) {
      document.body.classList.add('bsiAP-pieno');
      try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen({ navigationUI: 'hide' }).catch(function () {}); } catch (e) {}
      try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
    } else {
      document.body.classList.remove('bsiAP-pieno');
      try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {}); } catch (e) {}
    }
    var b2 = document.getElementById('apB-pieno');
    if (b2) { b2.textContent = vuole ? '⤡' : '⛶'; b2.setAttribute('aria-label', vuole ? t('esci dallo schermo intero', 'exit full screen') : t('schermo intero', 'full screen')); }
    dimPrec = '';
  }
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && document.body.classList.contains('bsiAP-pieno')) schermoIntero(false);
  });

  /* LA BARRA DEI POTERI: un tasto per elemento raccolto (al massimo nove),
     con il numero, il colore e il costo; si sceglie col tocco, con 1–9 o
     con la rotella */
  function scegliPotere(sim) {
    if (!S || !S.inventario.some(function (x) { return x.sim === sim; })) return;
    if (S.potere === sim) return;
    S.potere = sim;
    bip(760, 0.05, 'triangle', 0.04);
    avviso('✦ ' + sim + ' · ' + nomePotere(sim), t('energia ', 'energy ') + costoPotere(sim));
  }
  function scorriPotere(verso) {
    var l = S.inventario.map(function (x) { return x.sim; }).slice(0, 9);
    if (!l.length) return;
    var i = l.indexOf(potereAttivo());
    scegliPotere(l[(i + verso + l.length) % l.length]);
  }
  function barraPoteri() {
    var l = S.inventario.slice(0, 9), pa = potereAttivo();
    return l.map(function (x, i) {
      var col = '#' + ('000000' + ((POTERI[x.sim] && POTERI[x.sim].colore) || 0xffffff).toString(16)).slice(-6);
      var pronto = (S.energia || 0) >= costoPotere(x.sim);
      return '<button class="bsiAP-pt' + (x.sim === pa ? ' sel' : '') + (pronto ? '' : ' scarico') + '" data-pot="' + x.sim +
             '" style="--c:' + col + '" aria-label="' + esc(x.sim + ' ' + nomePotere(x.sim)) + '"><i>' + (i + 1) + '</i>' + x.sim + '</button>';
    }).join('');
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
        '<button class="bsiAP-t" id="apB-pot" aria-label="' + t('scatena il potere', 'unleash the power') + '">✦</button>' +
        '<button class="bsiAP-t" id="apB-zoom" aria-label="' + t('mira (zoom)', 'aim (zoom)') + '">🔍</button>' +
        '<button class="bsiAP-t" id="apB-pieno" aria-label="' + t('schermo intero', 'full screen') + '">⛶</button>' +
        '<button class="bsiAP-t" id="apB-pugno" aria-label="' + t('pugno', 'punch') + '">👊</button>' +
        '<button class="bsiAP-t" id="apB-schiva" aria-label="' + t('schivata', 'dodge') + '">💨</button>' +
        '<button class="bsiAP-t fuoco" id="apB-spara" aria-label="' + t('spara', 'fire') + '">◉</button>' +
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
    /* il potere: tenendo premuto si carica */
    (function (b) {
      if (!b) return;
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (schermo === 'gioco') { b.classList.add('giu'); inizioCarica(); } });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { b.addEventListener(ev, function () { b.classList.remove('giu'); fineCarica(); }); });
    })(document.getElementById('apB-pot'));
    su('apB-schiva', function () { if (schermo === 'gioco') schiva(); });
    su('apB-zoom', function () { if (schermo === 'gioco') cambiaZoom(); });
    su('apB-pugno', function () { if (schermo === 'gioco') pugno(); });
    su('apB-pieno', function () { schermoIntero(); });
    /* sparare: tenendo premuto si spara di continuo */
    var bSp = document.getElementById('apB-spara'), raffica = null;
    if (bSp) {
      var fermaR = function () { if (raffica) clearInterval(raffica); raffica = null; bSp.classList.remove('giu'); };
      bSp.addEventListener('pointerdown', function (e) { e.preventDefault(); if (schermo !== 'gioco') return; bSp.classList.add('giu'); usaRapido(); raffica = setInterval(function () { if (schermo === 'gioco') usaRapido(); }, 250); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { bSp.addEventListener(ev, fermaR); });
    }
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

  /* ═════════════════════════════════════════════════════════════════════════
     IL COMBATTIMENTO

     LE ARMI. La pistola a capsula spara sempre: un getto di soluzione
     (danno 1); con un composto in capsula il getto e' quel composto (danno
     2, doppio sul nemico che lo teme) e ogni colpo andato a segno costa una
     dose. Mira dove guardi, fino a 16 m, se non c'e' un muro in mezzo.
     I POTERI. La sinistra scatena l'elemento scelto nella barra (1–9, la
     rotella, o un tocco sulla barra), consumando energia che si ricarica:
       scintille (i metalli)   la SCARICA che salta fra tre nemici e li
                               stordisce; il sodio e il potassio esplodono
       fiamma (O, H, C, S, P)  la PALLA DI FUOCO che esplode dove arriva
       vapore (Cl, F, Ar)      la NUBE tossica che resta e corrode;
                               l'azoto e' una nube di GELO che rallenta
       luce (gli altri)        l'ONDA D'URTO intorno a te; il piombo e
                               l'oro fanno uno SCUDO; l'uranio la FISSIONE
     I NEMICI. Tre specie con il loro punto debole chimico: il residuo (un
     solvente: lo distruggono gli ossidanti e il fuoco), la sentinella (un
     drone: la mandano in corto le scariche), l'automa (un robot: lo
     corrodono gli acidi, lo blocca il gelo).
     ═════════════════════════════════════════════════════════════════════════ */
  var SPECIE = {
    residuo: { vita: 3, nome: ['Residuo corrosivo', 'Corrosive residue'], altezza: 0.3, raggio: 0.62,
               debole: ['Cl', 'O', 'F', 'H2O2', 'H2SO4', 'HCl', 'NaOH', 'fiamma'], punti: 60 },
    drone:   { vita: 4, nome: ['Sentinella', 'Sentinel'], altezza: 1.55, raggio: 0.5,
               debole: ['scintille', 'NaOH', 'NaCl'], punti: 90 },
    automa:  { vita: 7, nome: ['Automa di servizio', 'Service automaton'], altezza: 1.0, raggio: 0.55,
               debole: ['HCl', 'H2SO4', 'HNO3', 'gelo'], punti: 140 }
  };
  /* I NEMICI DAI MODELLI (models/nemici/, forniti dall'utente): ogni specie
     ha il suo modello, il suo modo di attaccare, il suo colore (quello dei
     colpi, degli occhi, delle schegge) e il suo punto debole */
  var SPECIE_M = {
    verme:    { modello: 'verme', modo: 'mischia', vita: 4, alto: 1.75, raggio: 0.55, colore: 0x9fb7ff, vel: 2.1, portata: 1.5,
                nome: ['Verme di scarico', 'Drain worm'], debole: ['Cl', 'O', 'H2O2', 'fiamma'], punti: 70, anim: { idle: 'Idle', passo: 'WALK', corsa: 'RUN', attacco: 'ATTACK', ferito: 'WOUND_1', morte: 'DEATH' } },
    curvo:    { modello: 'curvo', modo: 'salto', vita: 5, alto: 1.5, raggio: 0.95, colore: 0xff6a4a, vel: 1.8, portata: 1.8,
                nome: ['Rampicante', 'Lurcher'], debole: ['fiamma', 'HCl'], punti: 90, rigBraccia: 0 },
    palude:   { modello: 'palude', modo: 'sputo', vita: 7, alto: 2.0, raggio: 0.62, colore: 0x8fe36b, vel: 1.0, portata: 1.4,
                nome: ['Fanghiglia', 'Bog thing'], debole: ['NaOH', 'O', 'fiamma'], punti: 110, rigBraccia: 0.7 },
    cervo:    { modello: 'cervo', modo: 'mischia', vita: 6, alto: 2.35, raggio: 0.55, colore: 0xff3040, vel: 2.6, portata: 1.7,
                nome: ['Il cervo', 'The deer'], debole: ['scintille', 'gelo'], punti: 130, anim: { idle: 'Take 001', passo: 'Take 001', corsa: 'Take 001' } },
    abissale: { modello: 'abissale', modo: 'fluttua', vita: 6, alto: 1.9, raggio: 0.6, colore: 0x3ee0c8, vel: 1.6, portata: 1.4, quota: 0.6,
                nome: ['Abissale', 'Abyssal'], debole: ['scintille', 'NaCl'], punti: 120 },
    mostro:   { modello: 'mostro', modo: 'carica', vita: 9, alto: 2.15, raggio: 0.7, colore: 0x3ef0ff, vel: 1.4, portata: 1.6,
                nome: ['Cristallino', 'Crystalline'], debole: ['HCl', 'H2SO4', 'HNO3', 'gelo'], punti: 160, anim: { idle: 'Anim', passo: 'Anim', corsa: 'Anim' } },
    bruto:    { modello: 'bruto', modo: 'carica', vita: 13, alto: 2.6, raggio: 0.85, colore: 0xff2a2a, vel: 1.1, portata: 2.0, abbassaBraccia: 1.15,
                nome: ['Bruto', 'Brute'], debole: ['gelo', 'U', 'HNO3'], punti: 220 }
  };
  var ACIDI = ['HCl', 'H2SO4', 'HNO3'];
  var proiettili = [], effetti = [], numeri = [], nubi = [];
  var CD = { sparo: 0, potere: 0 };
  /* LE VARIANTI. La stessa creatura cambia con l'atto: nel secondo e'
     piu' grossa, piu' veloce, attacca piu' spesso e con piu' colpi, ed e'
     ghiacciata (azzurra); nel terzo ancora di piu', ed e' rovente (rossa).
     Le ELITE hanno l'alone d'oro, sono piu' grandi e resistono il doppio */
  function variante(o) {
    if (o._var) return o._var;
    var a = o.atto || 1, el = !!o.elite;
    return (o._var = {
      atto: a, elite: el,
      vita: (1 + 0.75 * (a - 1)) * (el ? 2 : 1),
      scala: (1 + 0.1 * (a - 1)) * (el ? 1.28 : 1),
      vel: 1 + 0.18 * (a - 1) + (el ? 0.1 : 0),
      cd: Math.max(0.5, 1 - 0.18 * (a - 1) - (el ? 0.1 : 0)),
      extra: (a - 1) + (el ? 1 : 0),
      tinta: a === 2 ? 0x6ab4ff : a === 3 ? 0xff4a14 : null,
      punti: (1 + 0.5 * (a - 1)) * (el ? 2.5 : 1)
    });
  }
  function coloreDi(o) {
    var SM = SPECIE_M[o.specie], v = variante(o);
    if (v.elite) return 0xffd24a;
    if (!v.tinta) return SM.colore;
    return new T.Color(SM.colore).lerp(new T.Color(v.tinta), 0.65).getHex();
  }
  function specieDi(o) {
    var m = SPECIE_M[o.specie];
    if (m) {
      var v = variante(o);
      var pre = v.elite ? ['Élite · ', 'Elite · '] : v.atto === 2 ? ['', ''] : ['', ''];
      var suf = v.atto === 2 ? [' gelido', ' (frozen)'] : v.atto === 3 ? [' rovente', ' (molten)'] : ['', ''];
      return { vita: Math.round(m.vita * v.vita), nome: [pre[0] + m.nome[0] + suf[0], pre[1] + m.nome[1] + suf[1]],
               altezza: m.alto * v.scala * 0.55 + (m.quota || 0), raggio: m.raggio * v.scala,
               debole: m.debole, punti: Math.round(m.punti * v.punti), m: m };
    }
    return SPECIE[o.specie] || SPECIE.residuo;
  }
  function costoPotere(sim) {
    var tp = TIPO_POTERE[sim] || 'luce';
    if (sim === 'U') return 60;
    return tp === 'scintille' ? 25 : tp === 'fiamma' ? 30 : tp === 'vapore' ? 30 : 35;
  }
  function nomePotere(sim) {
    var tp = TIPO_POTERE[sim] || 'luce';
    if (sim === 'Na' || sim === 'K') return t('Scarica esplosiva', 'Explosive discharge');
    if (sim === 'N') return t('Nube di gelo', 'Frost cloud');
    if (sim === 'Pb' || sim === 'Au') return t('Scudo', 'Shield');
    if (sim === 'U') return t('Fissione', 'Fission');
    return { scintille: t('Scarica a catena', 'Chain discharge'), fiamma: t('Palla di fuoco', 'Fireball'),
             vapore: t('Nube tossica', 'Toxic cloud'), luce: t('Onda d’urto', 'Shockwave') }[tp];
  }
  /* il nemico nel mondo */
  function posNemico(o) {
    var st = mondo.zona.stanze.filter(function (x) { return x.id === o._stanza; })[0];
    return new T.Vector3((st ? st.x : 0) + o.x, specieDi(o).altezza + (o._quota || 0) + (o._quotaSalto || 0), (st ? st.z : 0) + o.z);
  }
  function nemiciVivi(raggio, centro) {
    var out = [];
    if (!mondo || S.lab) return out;
    tuttiGliOggetti(function (o) {
      if (o.tipo !== 'nemico' || !o.vivo || !o._nodo) return;
      var p = posNemico(o);
      if (!centro || p.distanceTo(centro) <= raggio) out.push({ o: o, p: p });
    });
    return out;
  }
  /* quale nemico ho nel mirino: il raggio dalla telecamera, la sfera del
     nemico, niente muri in mezzo */
  function nelMirino(portata) {
    if (!camera || !mondo || S.lab) return null;
    var orig = camera.getWorldPosition(new T.Vector3()), dir = camera.getWorldDirection(new T.Vector3());
    var migl = null, dm = portata || 16;
    nemiciVivi().forEach(function (n) {
      var v = n.p.clone().sub(orig), lungo = v.dot(dir);
      if (lungo < 0.2 || lungo > dm) return;
      var lat = v.addScaledVector(dir, -lungo).length();
      if (lat > specieDi(n.o).raggio * (zoom > 0.5 ? 1.1 : 1.35)) return;
      if (!vistaLibera(S.pos.x, S.pos.z, n.p.x, n.p.z)) return;
      dm = lungo; migl = n;
    });
    if (S.boss && S.boss.attivo && S.boss._nodo) {
      var bp = S.boss._nodo.getWorldPosition(new T.Vector3()); bp.y += 1.2;
      var v2 = bp.clone().sub(orig), l2 = v2.dot(dir);
      if (l2 > 0.2 && l2 < dm && v2.addScaledVector(dir, -l2).length() < 1.6) migl = { boss: S.boss, p: bp };
    }
    return migl;
  }
  function moltiplicatore(o, chi) {
    var deb = specieDi(o).debole;
    return (deb.indexOf(chi) >= 0 || deb.indexOf(TIPO_POTERE[chi]) >= 0) ? 2 : 1;
  }
  function ferisci(o, quanto, chi, p) {
    if (!o.vivo) return;
    /* LA FRANTUMAZIONE: una creatura gelata che prende un colpo pesante va
       in pezzi, e le schegge feriscono chi le sta intorno */
    if (o._gelo > 0 && quanto >= 4 && chi !== 'gelo' && SPECIE_M[o.specie]) {
      var pf = p || posNemico(o);
      o._gelo = 0; o._frantumato = true;
      reazione('frantuma', pf, 0xbfe6ff);
      for (var k = 0; k < 30; k++) particella(pf, new T.Vector3((Math.random() - 0.5) * 7, Math.random() * 4, (Math.random() - 0.5) * 7), k % 3 ? 0xbfe6ff : 0xffffff, 0.6 + Math.random() * 0.4, 0.06 + Math.random() * 0.08, 9);
      nemiciVivi(3, pf).forEach(function (n) { if (n.o !== o) ferisci(n.o, 2, 'gelo', n.p); });
      quanto = 999;
    }
    var k = chi ? moltiplicatore(o, chi) : 1, d = Math.max(1, Math.round(quanto * k));
    var vPrima = o.vita == null ? specieDi(o).vita : o.vita;
    o.vita = vPrima - d;
    /* il colpo forte schizza sul muro dietro; ucciso con molto piu' del
       necessario, va in pezzi */
    if (SPECIE_M[o.specie]) {
      var pc = p || posNemico(o);
      if (d >= 3 && !o._frantumato) schizzoSulMuro(pc, new T.Vector3(pc.x - S.pos.x, 0, pc.z - S.pos.z));
      if (o.vita <= 0 && (d >= vPrima + 3 || d >= 999)) o._sovra = true;
    }
    o._lampo = 1; o._ferito = 1;
    numero(p || posNemico(o), (k > 1 ? '✦' : '') + d, k > 1 ? '#ffd24a' : '#ffffff');
    segnoColpo(k > 1);
    if (o.vita <= 0) abbattiNemico(o, p || posNemico(o));
  }
  function abbattiNemico(o, p) {
    o.vivo = false; o.abbattuto = true; o._muore = 1;
    if (SPECIE_M[o.specie] && p) {
      var pT = p.clone ? p.clone() : new T.Vector3(p.x, p.y, p.z);
      setTimeout(function () { pozzaSotto(pT, 1.2 + Math.random() * 0.8); }, 350);
      if (o._sovra) {
        lanciaBrandelli(pT, o._frantumato ? 16 : 18, !!o._frantumato);
        if (!o._frantumato) sangue(pT, 0x5a0303, 30, null);
      }
    }
    if (o._mod && animaClip(o, 'morte', true)) o._muoreClip = true;
    if (o._chiave) S.presi[o._chiave] = true;
    var sp = specieDi(o);
    S.punti += sp.punti;
    S.uccisi = (S.uccisi || 0) + 1;
    esplosione(p, o.specie === 'residuo' ? 0x8fe36b : 0xffb04d, o.specie === 'automa' ? 1.4 : 1, true);
    bip(o.specie === 'residuo' ? 300 : 180, 0.25, 'sawtooth', 0.07);
    /* l'energia torna, e a volte una tacca di salute */
    S.energia = Math.min(100, (S.energia || 0) + 15);
    if (S.vite < S.vitaMax && ((S.uccisi * 7) % 10) < 3) { S.vite++; avviso(t('+1 salute', '+1 health'), sp.nome[lingua() === 'en' ? 1 : 0]); }
  }
  function lingua() { return (globale.BSI_LINGUA || document.documentElement.lang || 'it').slice(0, 2); }

  /* SPARARE */
  function sparo() {
    if (!S || schermo !== 'gioco' || S.finito) return;
    if (CD.sparo > 0) return;
    CD.sparo = 0.24;
    spruzzo();
    var bers = nelMirino(16);
    var id = S.inMano && ricetta(S.inMano) ? S.inMano : null;
    var orig = camera.getWorldPosition(new T.Vector3()), dir = camera.getWorldDirection(new T.Vector3());
    var fine = bers ? bers.p.clone() : orig.clone().addScaledVector(dir, 12);
    traccia(orig.clone().add(new T.Vector3(0, -0.12, 0)).addScaledVector(dir, 0.6), fine, animV.colore || 0x9fe8ff);
    luceLampo(orig.clone().addScaledVector(dir, 0.8), animV.colore || 0x9fe8ff, 1.2, 0.08);
    if (!bers) return;
    if (bers.boss) { if (id) { usaSu(id); consumaDose(id); } else avviso(t('Il guardiano si ferma solo con il composto giusto', 'The guardian only stops with the right compound')); return; }
    ferisci(bers.o, id ? 2 : 1, id, bers.p);
    scintille(bers.p, animV.colore || 0x9fe8ff, 10);
    if (id) consumaDose(id);
  }
  function consumaDose(id) {
    var c = S.composti.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    c.dosi--;
    if (c.dosi <= 0) { S.composti.splice(S.composti.indexOf(c), 1); S.inMano = disponibili().filter(function (x) { return ricetta(x); })[0] || null; }
  }

  /* I POTERI */
  function usaPotere(potenza) {
    if (!S || schermo !== 'gioco' || S.finito) return;
    var sim = potereAttivo();
    if (!sim) { avviso(t('Nessun potere: raccogli un elemento', 'No power: collect an element')); return; }
    if (CD.potere > 0) return;
    /* il potere CARICATO (tenendo premuto): fino a due volte e mezzo piu'
       forte e piu' grande, costa fino a meta' in piu' */
    var pz = Math.max(1, Math.min(2.5, potenza || 1));
    var costo = Math.round(costoPotere(sim) * (1 + (pz - 1) / 3));
    if ((S.energia || 0) < costo) { avviso(t('Energia insufficiente', 'Not enough energy'), Math.round(S.energia || 0) + '/' + costo); bip(140, 0.1, 'square', 0.04); return; }
    S.energia -= costo;
    CD.potere = 0.6;
    lancio();
    var col = (POTERI[sim] && POTERI[sim].colore) || 0xffffff;
    var tp = TIPO_POTERE[sim] || 'luce';
    var orig = camera.getWorldPosition(new T.Vector3()), dir = camera.getWorldDirection(new T.Vector3());
    var mano = orig.clone().add(new T.Vector3(0, -0.2, 0)).addScaledVector(dir, 0.5);
    var x = S.inventario.filter(function (y) { return y.sim === sim; })[0];
    if (x) { x.usi++; if (x.usi % 3 === 0 && x.padronanza < 5) x.padronanza++; }
    var forza = (1 + ((x && x.padronanza) || 1) * 0.15) * pz;
    if (pz > 1.3) { fermaTempo(0.05); luceLampo(mano, col, 3 * pz, 0.25); }
    if (sim === 'Pb' || sim === 'Au') {
      S.scudo = 4; S.immune = Math.max(S.immune, 240);
      esplosione(orig.clone().addScaledVector(dir, 0.8), col, 0.8, false);
      avviso('🛡 ' + nomePotere(sim), t('4 secondi senza danni', '4 seconds without damage'));
      bip(520, 0.3, 'sine', 0.07);
      return;
    }
    if (tp === 'scintille') {
      /* la scarica: dal mirino al nemico piu' vicino, poi a catena */
      var colpiti = [], da = mano.clone(), primo = nelMirino(18);
      var lista = nemiciVivi(14, orig).sort(function (a2, b2) { return a2.p.distanceTo(orig) - b2.p.distanceTo(orig); });
      if (primo && primo.o) lista.unshift(primo);
      for (var i = 0; i < lista.length && colpiti.length < 2 + Math.round(pz); i++) {
        var n = lista[i];
        if (colpiti.indexOf(n.o) >= 0 || n.p.distanceTo(da) > 9 * Math.sqrt(pz)) continue;
        if (!vistaLibera(da.x, da.z, n.p.x, n.p.z)) continue;
        fulmine(da, n.p, col);
        /* LA CONDUZIONE: sul ghiaccio o nell'acido la scarica corre ovunque */
        if (conduce(n)) {
          reazione('conduzione', n.p, 0x9fe8ff);
          nemiciVivi(4.5, n.p).forEach(function (m2) { if (m2.o !== n.o) { fulmine(n.p, m2.p, 0x9fe8ff); ferisci(m2.o, 2 * forza, sim, m2.p); m2.o._stordito = 1.4; } });
          ferisci(n.o, 2 * forza, sim, n.p);
        }
        ferisci(n.o, 2 * forza, sim, n.p);
        n.o._stordito = 1.4;
        colpiti.push(n.o); da = n.p.clone();
      }
      if (!colpiti.length) fulmine(mano, orig.clone().addScaledVector(dir, 7), col);
      if (sim === 'Na' || sim === 'K') esplosione(colpiti.length ? da : orig.clone().addScaledVector(dir, 5), 0xffd24a, 1.3, true, 2, sim);
      bip(900, 0.12, 'sawtooth', 0.06);
    } else if (tp === 'fiamma') {
      var pf = proiettile(mano, dir.clone().multiplyScalar(14), col, true, sim, 3 * forza);
      pf.o.scale.multiplyScalar(pz); pf.dim = pz;
      proiettili.push(pf);
      bip(260, 0.25, 'sawtooth', 0.06);
    } else if (tp === 'vapore') {
      var dove = nelMirino(12);
      var punto = dove ? dove.p.clone() : orig.clone().addScaledVector(dir, 6);
      punto.y = 0.5;
      nubi.push(creaNube(punto, sim === 'N' ? 0xbfe6ff : col, sim === 'N' ? 'gelo' : 'tossica', sim));
      bip(sim === 'N' ? 1400 : 200, 0.4, 'sine', 0.05);
    } else if (sim === 'U') {
      var dU = nelMirino(18), pU = dU ? dU.p.clone() : orig.clone().addScaledVector(dir, 8);
      esplosione(pU, 0x6aff6a, 2.4 * Math.sqrt(pz), true, Math.round(5 * pz), sim);
      bip(80, 0.6, 'sawtooth', 0.1);
    } else {
      /* l'onda d'urto intorno */
      esplosione(new T.Vector3(S.pos.x, 1, S.pos.z), col, 1.8 * Math.sqrt(pz), true, 0, sim);
      nemiciVivi(4.5 * Math.sqrt(pz), new T.Vector3(S.pos.x, 1, S.pos.z)).forEach(function (n) {
        ferisci(n.o, 2 * pz, sim, n.p);
        var v = n.p.clone().sub(new T.Vector3(S.pos.x, n.p.y, S.pos.z)).normalize();
        n.o._spinta = { x: v.x * 0.12 * pz, z: v.z * 0.12 * pz };
        if (pz > 1.8) n.o._crollo = 1;
      });
      bip(160, 0.35, 'triangle', 0.08);
    }
    scossa = Math.max(scossa, 0.35 * pz);
  }

  /* GLI EFFETTI NEL MONDO: sprite additivi in un piccolo deposito, una
     luce sola che lampeggia (le luci della scena sono sempre le stesse) */
  var texPunto = null;
  function texEffetto() {
    if (texPunto) return texPunto;
    var cv = document.createElement('canvas'); cv.width = cv.height = 64;
    var q = cv.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = g; q.fillRect(0, 0, 64, 64);
    return (texPunto = new T.CanvasTexture(cv));
  }
  function sprite(col, op) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: texEffetto(), color: col, transparent: true, depthWrite: false,
                                                 blending: T.AdditiveBlending, opacity: op == null ? 1 : op, toneMapped: false }));
    scena.add(sp);
    return sp;
  }
  function particella(p, v, col, vita, dim, gravita) {
    var sp = sprite(col); sp.position.copy(p); sp.scale.setScalar(dim);
    effetti.push({ o: sp, v: v, t: 0, vita: vita, dim: dim, g: gravita == null ? 4 : gravita });
  }
  /* ── le texture degli effetti realistici ─────────────────────────────── */
  var texFumoT = null, texGocciaT = null, texBraceT = null;
  function texFumo() {
    if (texFumoT) return texFumoT;
    /* un batuffolo di fumo: rumore frattale dentro un cerchio sfumato */
    var N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N;
    var q = cv.getContext('2d'), img = q.createImageData(N, N), d = img.data;
    function h(x, y) { var v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); }
    function n2(x, y) { var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      return (h(ix, iy) * (1 - fx) + h(ix + 1, iy) * fx) * (1 - fy) + (h(ix, iy + 1) * (1 - fx) + h(ix + 1, iy + 1) * fx) * fy; }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var u = x / N * 6, v = y / N * 6, f = n2(u, v) * 0.5 + n2(u * 2, v * 2) * 0.25 + n2(u * 4, v * 4) * 0.125 + n2(u * 8, v * 8) * 0.0625;
      var r = Math.hypot(x - N / 2, y - N / 2) / (N / 2), m = Math.max(0, 1 - r); m = m * m * (3 - 2 * m);
      var a = Math.max(0, Math.min(1, (f - 0.25) * 1.9)) * m, i = (y * N + x) * 4, l = 200 + f * 55;
      d[i] = d[i + 1] = d[i + 2] = l; d[i + 3] = a * 255;
    }
    q.putImageData(img, 0, 0);
    return (texFumoT = new T.CanvasTexture(cv));
  }
  function texGoccia() {
    if (texGocciaT) return texGocciaT;
    /* una goccia allungata: si stira lungo la velocita' */
    var cv = document.createElement('canvas'); cv.width = 64; cv.height = 16;
    var q = cv.getContext('2d'), g = q.createRadialGradient(44, 8, 0, 44, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.7, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = g; q.fillRect(0, 0, 64, 16);
    var g2 = q.createLinearGradient(0, 0, 44, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(255,255,255,0.85)');
    q.fillStyle = g2; q.beginPath(); q.moveTo(0, 8); q.lineTo(44, 3); q.lineTo(44, 13); q.closePath(); q.fill();
    return (texGocciaT = new T.CanvasTexture(cv));
  }
  function spriteCon(tex, col, op, additivo) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, color: col, transparent: true, depthWrite: false, opacity: op,
                                                 blending: additivo ? T.AdditiveBlending : T.NormalBlending, toneMapped: !!(!additivo) }));
    scena.add(sp);
    return sp;
  }
  /* il fumo: sale, si allarga, gira piano, svanisce */
  function fumo(p, v, col, vita, dim, op) {
    var sp = spriteCon(texFumo(), col, op == null ? 0.5 : op, false);
    sp.position.copy(p); sp.scale.setScalar(dim); sp.material.rotation = Math.random() * 6.28;
    effetti.push({ o: sp, v: v, t: 0, vita: vita, dim: dim, g: -0.15, tipo: 'fumo', op: op == null ? 0.5 : op, giro: (Math.random() - 0.5) * 0.8 });
  }
  /* la goccia di sangue: stirata lungo la velocita' (si orienta sullo
     schermo a ogni fotogramma), cade, e dove tocca terra macchia */
  function gocciaSangue(p, v, dim) {
    var sp = spriteCon(texGoccia(), new T.Color(0x5a0303).lerp(new T.Color(0x8a0a06), Math.random()), 0.95, false);
    sp.position.copy(p);
    effetti.push({ o: sp, v: v, t: 0, vita: 1.6, dim: dim, g: 9.8, tipo: 'goccia', op: 0.95 });
  }
  /* la brace: una scintilla stirata, calda, che cade */
  function brace(p, v, col) {
    var sp = spriteCon(texGoccia(), new T.Color(col).lerp(new T.Color(0xffd080), 0.6), 1, true);
    sp.position.copy(p);
    effetti.push({ o: sp, v: v, t: 0, vita: 0.5 + Math.random() * 0.7, dim: 0.05 + Math.random() * 0.04, g: 5, tipo: 'brace', op: 1 });
  }
  /* LA PALLA DI FUOCO: una sfera deformata dal rumore che ribolle, colori
     dal bianco del cuore al colore dell'elemento al nero del bordo che
     brucia; cresce e si consuma in mezzo secondo */
  var geoFuoco = null, FUOCO_VS = [
    'uniform float tempo; uniform float gonfia; varying vec3 vN; varying vec3 vV; varying float vR;',
    'float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }',
    'float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),',
    '             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }',
    'float fbm3(vec3 p){ return n3(p)*0.5 + n3(p*2.03)*0.25 + n3(p*4.01)*0.125 + n3(p*8.0)*0.0625; }',
    'void main(){',
    '  float d = fbm3(normal * 2.4 + vec3(0.0, -tempo * 3.0, tempo * 1.3));',
    '  vR = d;',
    '  vec3 pos = position * (1.0 + (d - 0.45) * gonfia);',
    '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
    '  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);',
    '  gl_Position = projectionMatrix * mv;',
    '}'].join('\n');
  var FUOCO_FS = [
    'uniform vec3 colore; uniform float eta; varying vec3 vN; varying vec3 vV; varying float vR;',
    'void main(){',
    '  float fr = abs(dot(normalize(vN), normalize(vV)));',
    '  float caldo = clamp(vR * 1.5 * (0.35 + fr) * (1.0 - eta * 0.9), 0.0, 1.0);',
    '  vec3 c = mix(vec3(0.04, 0.03, 0.025), colore * 1.6, smoothstep(0.18, 0.55, caldo));',
    '  c = mix(c, vec3(1.6, 1.45, 1.1), smoothstep(0.62, 0.95, caldo));',
    '  float a = smoothstep(0.02, 0.4, fr) * (1.0 - smoothstep(0.55, 1.0, eta)) * smoothstep(0.15, 0.4, vR + 0.25 - eta * 0.3);',
    '  gl_FragColor = vec4(c, a);',
    '}'].join('\n');
  function pallaDiFuoco(p, col, dim) {
    if (!geoFuoco) geoFuoco = new T.IcosahedronGeometry(1, IMP.grafica === 'alta' ? 4 : 3);
    var m = new T.Mesh(geoFuoco, new T.ShaderMaterial({
      uniforms: { tempo: { value: Math.random() * 10 }, gonfia: { value: 0.9 }, colore: { value: new T.Color(col) }, eta: { value: 0 } },
      vertexShader: FUOCO_VS, fragmentShader: FUOCO_FS, transparent: true, depthWrite: false, toneMapped: false }));
    m.position.copy(p); m.scale.setScalar(0.25 * dim); m.renderOrder = 7;
    scena.add(m);
    effetti.push({ o: m, v: new T.Vector3(0, 0.6, 0), t: 0, vita: 0.55 + dim * 0.12, dim: dim, g: 0, tipo: 'fuoco' });
    return m;
  }
  function scintille(p, col, n) {
    for (var i = 0; i < n; i++) particella(p, new T.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4), col, 0.35 + Math.random() * 0.3, 0.08, 6);
  }
  function esplosione(p, col, dim, danno2, quanto, chi) {
    if (!ps1()) {
      /* L'ESPLOSIONE VERA: un lampo breve, la palla di fuoco (uno shader
         di rumore che ribolle, dal bianco al colore al nero), il fumo che
         sale e si allarga, le braci che volano. Niente nuvola bianca */
      particella(p, new T.Vector3(), 0xffffff, 0.07, 0.9 * dim, 0);
      pallaDiFuoco(p, col, dim);
      for (var f = 0; f < 3 + dim * 4; f++) fumo(p.clone().add(new T.Vector3((Math.random() - 0.5) * 0.6 * dim, Math.random() * 0.4 * dim, (Math.random() - 0.5) * 0.6 * dim)),
        new T.Vector3((Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 0.9, (Math.random() - 0.5) * 1.2), 0x1c1a18, 1.4 + Math.random() * 1.4, 0.7 * dim + Math.random() * 0.5, 0.55);
      for (var b = 0; b < 10 + dim * 10; b++) brace(p, new T.Vector3(Math.random() - 0.5, Math.random() * 0.9, Math.random() - 0.5).normalize().multiplyScalar(3 + Math.random() * 6 * dim), col);
      luceLampo(p, col, 3 * dim, 0.35);
      scossa = Math.max(scossa, 0.5 * dim);
      if (danno2 && quanto) nemiciVivi(2.6 * dim, p).forEach(function (n) { ferisci(n.o, quanto, chi, n.p); });
      return;
    }
    for (var i = 0; i < 26 * dim; i++) {
      var v = new T.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 4 * dim);
      particella(p, v, i % 3 ? col : 0xffffff, 0.5 + Math.random() * 0.5, 0.18 * dim + Math.random() * 0.2, 2);
    }
    particella(p, new T.Vector3(), col, 0.3, 1.5 * dim, 0);
    luceLampo(p, col, 3 * dim, 0.3);
    scossa = Math.max(scossa, 0.5 * dim);
    if (danno2 && quanto) nemiciVivi(2.6 * dim, p).forEach(function (n) { ferisci(n.o, quanto, chi, n.p); });
  }
  function traccia(a2, b2, col) {
    var n = Math.max(4, Math.round(a2.distanceTo(b2) / 0.4));
    for (var i = 0; i <= n; i++) particella(a2.clone().lerp(b2, i / n), new T.Vector3(), col, 0.12 + i / n * 0.05, 0.07, 0);
  }
  function fulmine(a2, b2, col) {
    if (!ps1()) {
      /* il fulmine vero: un nastro frastagliato con i suoi rami, che
         cambia forma a ogni istante, e qualche scintilla dove colpisce */
      arco(a2, b2, col, 0.24, 0.32, 2, 0.22);     /* l'alone */
      arco(a2, b2, col, 0.24, 0.07, 3);
      arco(a2, b2, 0xffffff, 0.12, 0.025, 0);
      scintille(b2, col, 6);
      luceLampo(b2, col, 2.6, 0.18);
      return;
    }
    var n = 14, prec = a2.clone();
    for (var i = 1; i <= n; i++) {
      var p = a2.clone().lerp(b2, i / n);
      if (i < n) p.add(new T.Vector3((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35));
      for (var k = 0; k < 3; k++) particella(prec.clone().lerp(p, k / 3), new T.Vector3(), k ? col : 0xffffff, 0.18, 0.09, 0);
      prec = p;
    }
    luceLampo(b2, col, 2, 0.15);
  }
  function luceLampo(p, col, int, durata) {
    if (!luci || !luci.lampo) return;
    luci.lampo.position.copy(p); luci.lampo.color.setHex(col);
    luci.lampo.intensity = int; luci.lampo.userData.cala = int / Math.max(0.05, durata);
  }
  /* ═════════════════════════════════════════════════════════════════════════
     I FULMINI: un nastro sempre rivolto alla telecamera lungo una linea
     spezzata (spostamento del punto medio, cinque volte: 33 punti), con
     due o tre rami che si staccano e si assottigliano. La forma si rifa'
     ogni 45 ms: il fulmine trema. La texture e' un taglio di luce: bianca
     al centro, colorata e trasparente ai bordi
     ═════════════════════════════════════════════════════════════════════════ */
  var archi = [], texArco = null;
  function texturaArco() {
    if (texArco) return texArco;
    var cv = document.createElement('canvas'); cv.width = 4; cv.height = 64;
    var q = cv.getContext('2d'), g = q.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(0.47, 'rgba(255,255,255,1)'); g.addColorStop(0.53, 'rgba(255,255,255,1)');
    g.addColorStop(0.65, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = g; q.fillRect(0, 0, 4, 64);
    return (texArco = new T.CanvasTexture(cv));
  }
  function spezzata(a, b, livelli, amp) {
    var pts = [a.clone(), b.clone()], tmp = new T.Vector3(), dir = new T.Vector3();
    for (var l = 0; l < livelli; l++) {
      var nuovi = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i], p1 = pts[i + 1], len = p0.distanceTo(p1);
        dir.subVectors(p1, p0).normalize();
        tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        tmp.addScaledVector(dir, -tmp.dot(dir)).normalize().multiplyScalar(len * amp * (Math.random() * 0.8 + 0.2));
        nuovi.push(p0.clone().lerp(p1, 0.5).add(tmp), p1);
      }
      pts = nuovi;
    }
    return pts;
  }
  var MAX_SEG = 72;
  function arco(a, b, col, vita, larg, rami, op) {
    if (!scena || archi.length > 40) return;
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(MAX_SEG * 4 * 3), 3).setUsage(T.DynamicDrawUsage));
    var uv = new Float32Array(MAX_SEG * 4 * 2), idx = [];
    for (var s2 = 0; s2 < MAX_SEG; s2++) {
      uv.set([0, 0, 0, 1, 1, 0, 1, 1], s2 * 8);
      idx.push(s2 * 4, s2 * 4 + 1, s2 * 4 + 2, s2 * 4 + 2, s2 * 4 + 1, s2 * 4 + 3);
    }
    geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.setIndex(idx);
    var m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: texturaArco(), color: new T.Color(col).lerp(new T.Color(0xffffff), 0.3), transparent: true, opacity: op == null ? 1 : op,
                                                      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
    m.frustumCulled = false; m.renderOrder = 6;
    scena.add(m);
    archi.push({ a: a.clone(), b: b.clone(), t: 0, vita: vita, larg: larg, rami: rami, m: m, rifai: 0, linee: null });
  }
  function passoArchi(dt) {
    if (!archi.length) return;
    var cam = camera.position, side = new T.Vector3(), tg = new T.Vector3(), vista2 = new T.Vector3();
    for (var i = archi.length - 1; i >= 0; i--) {
      var A = archi[i];
      A.t += dt; A.rifai -= dt;
      if (A.t >= A.vita) { scena.remove(A.m); A.m.geometry.dispose(); A.m.material.dispose(); archi.splice(i, 1); continue; }
      if (A.rifai <= 0 || !A.linee) {
        A.rifai = 0.045;
        var lun = A.a.distanceTo(A.b), principale = spezzata(A.a, A.b, lun > 3 ? 5 : 4, 0.22);
        A.linee = [{ p: principale, w: A.larg }];
        for (var r2 = 0; r2 < A.rami; r2++) {
          var da = principale[1 + (Math.random() * (principale.length - 2) | 0)];
          var verso = new T.Vector3().subVectors(A.b, A.a).normalize().add(new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.4)).normalize();
          A.linee.push({ p: spezzata(da, da.clone().addScaledVector(verso, lun * (0.2 + Math.random() * 0.3)), 3, 0.3), w: A.larg * 0.55 });
        }
      }
      var pos = A.m.geometry.attributes.position, arr = pos.array, s3 = 0;
      var svanire = 1 - Math.pow(A.t / A.vita, 2);
      A.linee.forEach(function (L) {
        for (var k = 0; k < L.p.length - 1 && s3 < MAX_SEG; k++, s3++) {
          var p0 = L.p[k], p1 = L.p[k + 1];
          tg.subVectors(p1, p0); vista2.subVectors(p0, cam);
          side.crossVectors(tg, vista2).normalize();
          var w0 = L.w * svanire * (1 - k / L.p.length * 0.5), w1 = L.w * svanire * (1 - (k + 1) / L.p.length * 0.5), o = s3 * 12;
          arr[o] = p0.x - side.x * w0; arr[o + 1] = p0.y - side.y * w0; arr[o + 2] = p0.z - side.z * w0;
          arr[o + 3] = p0.x + side.x * w0; arr[o + 4] = p0.y + side.y * w0; arr[o + 5] = p0.z + side.z * w0;
          arr[o + 6] = p1.x - side.x * w1; arr[o + 7] = p1.y - side.y * w1; arr[o + 8] = p1.z - side.z * w1;
          arr[o + 9] = p1.x + side.x * w1; arr[o + 10] = p1.y + side.y * w1; arr[o + 11] = p1.z + side.z * w1;
        }
      });
      for (var z2 = s3 * 12; z2 < arr.length; z2++) arr[z2] = 0;
      pos.needsUpdate = true;
      A.m.geometry.setDrawRange(0, s3 * 6);
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL SANGUE CHE RESTA: le pozze sotto chi cade, gli schizzi sul muro
     dietro chi incassa un colpo forte, i brandelli che volano quando una
     creatura esplode e restano a terra. Un numero massimo (le piu' vecchie
     se ne vanno): la scena non si riempie all'infinito. Con «sangue
     ridotto» niente di tutto questo (restano i pezzi di ghiaccio)
     ═════════════════════════════════════════════════════════════════════════ */
  var macchieV = [], brandelli = [], geoBrandello = null, matBrandello = null, matGhiaccio = null;
  function conSangue() { return IMP.sangue !== 'ridotto' && !ps1() && G && G.macchia; }
  function lasciaMacchia(m) {
    scena.add(m); macchieV.push(m);
    if (macchieV.length > 60) { var v = macchieV.shift(); scena.remove(v); }
  }
  function pozzaSotto(p, dim) {
    if (!conSangue()) return;
    var m = G.macchia('pozza', dim, dim);
    m.rotation.set(-Math.PI / 2, 0, Math.random() * 6.28);
    m.position.set(p.x, (S.lab ? S.labSuolo : 0) + 0.012 + macchieV.length * 0.0002, p.z);
    lasciaMacchia(m);
  }
  /* lo schizzo sul muro: si segue la direzione del colpo fino al muro
     della stanza; se li' c'e' una porta (si passa), niente */
  function schizzoSulMuro(p, dir) {
    if (!conSangue() || S.lab) return;
    var st = stanzaDi(p.x, p.z); if (!st) return;
    var dx = dir.x, dz = dir.z, l = Math.hypot(dx, dz); if (l < 0.01) return; dx /= l; dz /= l;
    var tx = dx > 0 ? (st.x + st.larg / 2 - p.x) / dx : dx < 0 ? (st.x - st.larg / 2 - p.x) / dx : 99;
    var tz = dz > 0 ? (st.z + st.prof / 2 - p.z) / dz : dz < 0 ? (st.z - st.prof / 2 - p.z) / dz : 99;
    var tt = Math.min(tx, tz); if (tt > 3.2) return;
    var hx = p.x + dx * tt, hz = p.z + dz * tt;
    if (puoStare(hx + dx * 0.4, hz + dz * 0.4)) return;
    var m = G.macchia('schizzo', 0.9 + Math.random() * 0.7);
    if (tx < tz) { m.position.set(hx - Math.sign(dx) * 0.13, Math.max(0.7, Math.min(2.3, p.y + 0.2)), hz); m.rotation.set(0, dx > 0 ? -Math.PI / 2 : Math.PI / 2, Math.random() * 6.28); }
    else { m.position.set(hx, Math.max(0.7, Math.min(2.3, p.y + 0.2)), hz - Math.sign(dz) * 0.13); m.rotation.set(0, dz > 0 ? Math.PI : 0, Math.random() * 6.28); }
    lasciaMacchia(m);
  }
  function lanciaBrandelli(p, n, ghiaccio) {
    if (ps1() || (!ghiaccio && !conSangue())) return;
    if (!geoBrandello) {
      /* la carne: un sasso irregolare (icosaedro deformato a caso), rosso
         scuro e bagnato; quattro forme diverse */
      geoBrandello = [0, 1, 2, 3].map(function () {
        var gb = new T.IcosahedronGeometry(1, 1), pa = gb.attributes.position, vb = new T.Vector3();
        for (var iv = 0; iv < pa.count; iv++) { vb.fromBufferAttribute(pa, iv); vb.multiplyScalar(0.55 + Math.random() * 0.7); vb.y *= 0.7; pa.setXYZ(iv, vb.x, vb.y, vb.z); }
        gb.computeVertexNormals(); return gb;
      });
      matBrandello = new T.MeshStandardMaterial({ color: 0x3a0505, roughness: 0.26, metalness: 0.05, envMapIntensity: 1.3 });
      matGhiaccio = new T.MeshStandardMaterial({ color: 0xcfeeff, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x10283a });
    }
    for (var i = 0; i < n; i++) {
      var m = new T.Mesh(geoBrandello[i % 4], ghiaccio ? matGhiaccio : matBrandello);
      var r = ghiaccio ? 0.03 + Math.random() * 0.08 : 0.02 + Math.random() * 0.045;
      m.scale.set(r * (0.7 + Math.random() * 0.8), r * (0.5 + Math.random() * 0.6), r * (0.7 + Math.random() * 0.8));
      m.position.copy(p); m.castShadow = true;
      scena.add(m);
      brandelli.push({ m: m, r: r, v: new T.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6),
                       w: new T.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12), fermo: false, macchia: !ghiaccio });
      if (brandelli.length > 70) { var v = brandelli.shift(); scena.remove(v.m); }
    }
  }
  function passoBrandelli(dt) {
    var suolo = S.lab ? S.labSuolo : 0;
    for (var i = 0; i < brandelli.length; i++) {
      var b = brandelli[i];
      if (b.fermo) continue;
      b.v.y -= 9.8 * dt;
      b.m.position.addScaledVector(b.v, dt);
      /* in volo la carne lascia una scia di gocce */
      if (b.macchia && Math.random() < 0.25) gocciaSangue(b.m.position.clone(), b.v.clone().multiplyScalar(0.3), 0.03);
      b.m.rotation.x += b.w.x * dt; b.m.rotation.y += b.w.y * dt; b.m.rotation.z += b.w.z * dt;
      if (b.m.position.y < suolo + b.r * 0.6) {
        b.m.position.y = suolo + b.r * 0.6;
        if (b.macchia && b.v.y < -2.5 && Math.random() < 0.4) pozzaSotto(b.m.position, 0.25 + Math.random() * 0.25);
        b.v.y *= -0.25; b.v.x *= 0.5; b.v.z *= 0.5; b.w.multiplyScalar(0.4);
        if (Math.abs(b.v.y) < 0.4 && Math.hypot(b.v.x, b.v.z) < 0.3) b.fermo = true;
      }
    }
  }
  function pulisciGore() {
    macchieV.forEach(function (m) { if (scena) scena.remove(m); }); macchieV = [];
    brandelli.forEach(function (b) { if (scena) scena.remove(b.m); }); brandelli = [];
    archi.forEach(function (A) { if (scena) scena.remove(A.m); A.m.geometry.dispose(); A.m.material.dispose(); }); archi = [];
  }

  function proiettile(p, v, col, mio, chi, danno2) {
    if (mio && !ps1() && TIPO_POTERE[chi] === 'fiamma') {
      /* la palla di fuoco del giocatore: fuoco vero che ribolle */
      if (!geoFuoco) geoFuoco = new T.IcosahedronGeometry(1, IMP.grafica === 'alta' ? 4 : 3);
      var fm = new T.Mesh(geoFuoco, new T.ShaderMaterial({
        uniforms: { tempo: { value: 0 }, gonfia: { value: 0.7 }, colore: { value: new T.Color(col) }, eta: { value: 0.05 } },
        vertexShader: FUOCO_VS, fragmentShader: FUOCO_FS, transparent: true, depthWrite: false, toneMapped: false }));
      fm.position.copy(p); fm.scale.setScalar(0.22); fm.renderOrder = 7; scena.add(fm);
      var nf = sprite(0xffe0a0); nf.position.copy(p); nf.scale.setScalar(0.35); nf.material.opacity = 0.5;
      return { o: fm, n: nf, v: v, col: col, mio: mio, chi: chi, danno: danno2 || 1, t: 0, fuoco: true };
    }
    var sp = sprite(col); sp.position.copy(p); sp.scale.setScalar(mio ? 0.45 : 0.32);
    var nucleo = sprite(0xffffff); nucleo.position.copy(p); nucleo.scale.setScalar(mio ? 0.18 : 0.14);
    return { o: sp, n: nucleo, v: v, col: col, mio: mio, chi: chi, danno: danno2 || 1, t: 0 };
  }
  function creaNube(p, col, tipo, chi) {
    var parti = [];
    for (var i = 0; i < 16; i++) {
      var sp = sprite(col, 0.32); sp.material.blending = T.NormalBlending;
      if (!ps1()) { sp.material.map = texFumo(); sp.material.rotation = Math.random() * 6.28; sp.material.needsUpdate = true; }
      sp.position.copy(p).add(new T.Vector3((Math.random() - 0.5) * 3.2, Math.random() * 1.4, (Math.random() - 0.5) * 3.2));
      sp.scale.setScalar(1.4 + Math.random() * 1.4); parti.push(sp);
    }
    return { p: p, parti: parti, tipo: tipo, chi: chi, t: 0, vita: 4.5, colpo: 0 };
  }
  /* i numeri dei danni, che salgono e svaniscono */
  function numero(p, testo, col) {
    var sc = document.getElementById('bsiAP-scena');
    if (!sc) return;
    var d = document.createElement('div');
    d.className = 'bsiAP-num'; d.textContent = testo; d.style.color = col; d.style.opacity = '0';
    sc.appendChild(d);
    numeri.push({ el: d, p: p.clone(), t: 0 });
  }
  function segnoColpo(forte) {
    var m2 = document.getElementById('bsiAP-mirino');
    if (!m2) return;
    m2.classList.remove('colpo', 'forte'); void m2.offsetWidth;
    m2.classList.add('colpo'); if (forte) m2.classList.add('forte');
    bip(forte ? 1300 : 1000, 0.04, 'square', 0.03);
  }

  /* il passo del combattimento: nemici, proiettili, nubi, effetti */
  function passoCombattimento(dt) {
    CD.sparo = Math.max(0, CD.sparo - dt); CD.potere = Math.max(0, CD.potere - dt); CD.pugno = Math.max(0, (CD.pugno || 0) - dt);
    S.energia = Math.min(100, (S.energia == null ? 100 : S.energia) + dt * 9);
    if (S.scudo > 0) S.scudo -= dt;
    /* i proiettili */
    for (var i = proiettili.length - 1; i >= 0; i--) {
      var q = proiettili[i];
      q.t += dt;
      if (q.g) q.v.y -= q.g * dt;
      q.o.position.addScaledVector(q.v, dt); q.n.position.copy(q.o.position);
      if (q.fuoco) {
        q.o.material.uniforms.tempo.value += dt * 1.5;
        if (Math.random() < 0.7) fumo(q.o.position.clone(), new T.Vector3((Math.random() - 0.5) * 0.3, 0.4, (Math.random() - 0.5) * 0.3), 0x2a2420, 0.7, 0.18 + Math.random() * 0.12, 0.45);
        if (Math.random() < 0.5) brace(q.o.position, new T.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.2, (Math.random() - 0.5) * 1.5), q.col);
      } else if (Math.random() < 0.6) particella(q.o.position, new T.Vector3(), q.col, 0.25, q.mio ? 0.22 : 0.15, 0);
      var finito = q.t > 3 || q.o.position.y < 0.05;
      if (!finito && !S.lab && !vistaLibera(q.o.position.x - q.v.x * dt, q.o.position.z - q.v.z * dt, q.o.position.x, q.o.position.z)) finito = true;
      if (!finito) {
        if (q.mio) {
          if (nemiciVivi(0.9, q.o.position).length) finito = true;
        } else if (!q.innocuo && Math.hypot(q.o.position.x - S.pos.x, q.o.position.z - S.pos.z) < 0.45 && Math.abs(q.o.position.y - (S.pos.y + 1.2)) < 0.8) {
          finito = true;
          if (!(S.scudo > 0)) danno(q.nome ? q.nome[lingua() === 'en' ? 1 : 0] + t(' ti ha colpito', ' hit you') : t('una sentinella ti ha colpito', 'a sentinel hit you'), q.fonte);
          else esplosione(q.o.position, 0xffcc33, 0.4, false);
        }
      }
      if (finito) {
        if (q.mio) {
          /* LA COMBUSTIONE: il fuoco dentro una nube tossica la fa esplodere */
          var nubeV = TIPO_POTERE[q.chi] === 'fiamma' ? nubi.filter(function (nb) { return nb.tipo === 'tossica' && nb.t < nb.vita && Math.hypot(nb.p.x - q.o.position.x, nb.p.z - q.o.position.z) < 3.4; })[0] : null;
          if (nubeV) {
            nubeV.t = nubeV.vita;
            reazione('combustione', nubeV.p.clone().setY(1), 0xffa040);
            esplosione(nubeV.p.clone().setY(1), 0xffa040, 2.4, true, 5, q.chi);
          }
          esplosione(q.o.position, q.col, 1.2 * (q.dim || 1), true, q.danno, q.chi);
        }
        else scintille(q.o.position, q.col, 8);
        scena.remove(q.o); scena.remove(q.n); q.o.material.dispose(); q.n.material.dispose();
        proiettili.splice(i, 1);
      }
    }
    /* le nubi */
    for (var j = nubi.length - 1; j >= 0; j--) {
      var nb = nubi[j];
      nb.t += dt; nb.colpo -= dt;
      nb.parti.forEach(function (sp, k) {
        sp.position.y += dt * 0.08; sp.material.rotation += dt * (k % 2 ? 0.3 : -0.3);
        sp.material.opacity = Math.min(0.36, (nb.vita - nb.t) * 0.16) * (0.75 + Math.sin(nb.t * 3 + k) * 0.25);
      });
      if (nb.colpo <= 0) {
        nb.colpo = 0.6;
        nemiciVivi(3, nb.p).forEach(function (n) {
          if (nb.tipo === 'gelo') { n.o._gelo = 3; ferisci(n.o, 1, 'gelo', n.p); }
          else ferisci(n.o, 1, nb.chi, n.p);
        });
      }
      if (nb.t > nb.vita) { nb.parti.forEach(function (sp) { scena.remove(sp); sp.material.dispose(); }); nubi.splice(j, 1); }
    }
    /* gli effetti */
    for (var k2 = effetti.length - 1; k2 >= 0; k2--) {
      var e = effetti[k2];
      e.t += dt;
      e.v.y -= e.g * dt;
      e.o.position.addScaledVector(e.v, dt);
      var f = 1 - e.t / e.vita;
      if (e.tipo === 'fuoco') {
        var u2 = e.t / e.vita;
        e.o.material.uniforms.tempo.value += dt; e.o.material.uniforms.eta.value = u2;
        e.o.scale.setScalar(e.dim * (0.25 + 1.1 * (1 - Math.pow(1 - Math.min(1, u2 * 1.6), 3))));
        e.v.multiplyScalar(0.96);
      } else if (e.tipo === 'fumo') {
        e.o.material.opacity = e.op * Math.min(1, e.t * 6) * f;
        e.o.scale.setScalar(e.dim * (1 + (1 - f) * 1.8));
        e.o.material.rotation += e.giro * dt;
        e.v.multiplyScalar(0.985);
      } else if (e.tipo === 'goccia' || e.tipo === 'brace') {
        /* stirata lungo il moto, vista dalla telecamera */
        if (camera) {
          var a2 = e.o.position.clone().project(camera), b2 = e.o.position.clone().addScaledVector(e.v, 0.03).project(camera);
          e.o.material.rotation = Math.atan2(b2.y - a2.y, (b2.x - a2.x) * camera.aspect);
          var vel = e.v.length();
          e.o.scale.set(e.dim * (1.2 + Math.min(5, vel * 0.5)), e.dim * 0.45, 1);
        }
        e.o.material.opacity = e.op * (e.tipo === 'brace' ? f : Math.min(1, f * 3));
        var suoloE = S && S.lab ? S.labSuolo : 0;
        if (e.tipo === 'goccia' && e.o.position.y < suoloE + 0.02) {
          if (Math.random() < 0.35) pozzaSotto(e.o.position, 0.12 + Math.random() * 0.22);
          e.t = e.vita;
        }
      } else {
        e.o.material.opacity = Math.max(0, f);
        e.o.scale.setScalar(e.dim * (e.g === 0 && e.dim > 1 ? 1 + (1 - f) * 0.6 : 0.6 + f * 0.4));
      }
      if (e.t >= e.vita) { scena.remove(e.o); e.o.material.dispose(); effetti.splice(k2, 1); }
    }
    if (effetti.length > 600) effetti.splice(0, effetti.length - 600).forEach(function (e) { scena.remove(e.o); e.o.material.dispose(); });
    if (luci && luci.lampo && luci.lampo.intensity > 0) luci.lampo.intensity = Math.max(0, luci.lampo.intensity - (luci.lampo.userData.cala || 10) * dt);
    passoArchi(dt); passoBrandelli(dt);
  }
  /* togliere tutto quando si cambia livello */
  function pulisciCombattimento() {
    proiettili.forEach(function (q) { if (scena) { scena.remove(q.o); scena.remove(q.n); } });
    effetti.forEach(function (e) { if (scena) scena.remove(e.o); });
    nubi.forEach(function (nb) { nb.parti.forEach(function (sp) { if (scena) scena.remove(sp); }); });
    numeri.forEach(function (n) { if (n.el.parentNode) n.el.parentNode.removeChild(n.el); });
    proiettili = []; effetti = []; nubi = []; numeri = [];
  }
  /* i numeri seguono il punto colpito sullo schermo */
  function aggiornaNumeri(dt) {
    var sc = document.getElementById('bsiAP-scena');
    if (!sc || !camera) return;
    var w = sc.clientWidth, h = sc.clientHeight;
    for (var i = numeri.length - 1; i >= 0; i--) {
      var n = numeri[i];
      n.t += dt; n.p.y += dt * 0.7;
      var v = n.p.clone().project(camera);
      n.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w) + 'px,' + ((1 - v.y) / 2 * h) + 'px) translate(-50%,-50%) scale(' + (1 + Math.max(0, 0.3 - n.t)) + ')';
      n.el.style.opacity = String(Math.max(0, 1 - n.t / 0.9));
      n.el.style.display = v.z > 1 ? 'none' : 'block';
      if (n.t > 0.9) { if (n.el.parentNode) n.el.parentNode.removeChild(n.el); numeri.splice(i, 1); }
    }
  }

  /* IL NEMICO: si muove nella sua stanza secondo la specie */
  function aggiornaNemico(o, sx, st, ora) {
    var dt = PASSO / 1000, sp = specieDi(o);
    if (o.vita == null) o.vita = sp.vita;
    o.t = (o.t || 0) + 1;
    var wx = sx.x + o.x, wz = sx.z + o.z;
    var dx = S.pos.x - wx, dz = S.pos.z - wz, d = Math.hypot(dx, dz) || 1;
    var vede = sx === st && d < 13 && vistaLibera(wx, wz, S.pos.x, S.pos.z);
    var lento = o._gelo > 0 ? 0.3 : 1;
    if (o._gelo > 0) o._gelo -= dt;
    if (o._stordito > 0) { o._stordito -= dt; lento = 0; }
    var mx = 0, mz = 0;
    if (vede) o._allerta = 4; else if (o._allerta > 0) o._allerta -= dt;
    var all = o._allerta > 0 && sx === st;
    if (o.specie === 'drone') {
      /* tiene la distanza, gira intorno, spara */
      o._quota = Math.sin(ora / 600 + o.t * 0.01) * 0.12;
      if (all) {
        var ideale = 5.5, rad = d > ideale + 1 ? 1 : d < ideale - 1.5 ? -1 : 0;
        var lato = Math.sin(o.t * 0.01 + (o.x * 3)) > 0 ? 1 : -1;
        mx = (dx / d * rad - dz / d * lato * 0.6) * 2.2 * dt * lento;
        mz = (dz / d * rad + dx / d * lato * 0.6) * 2.2 * dt * lento;
        o._colpo = (o._colpo == null ? 1.5 : o._colpo) - dt * lento;
        if (o._colpo <= 0 && vede) {
          o._colpo = 2.2 + ((o.t * 13) % 10) / 10;
          var pn = posNemico(o), bers = new T.Vector3(S.pos.x + S.vel.x * 25, S.pos.y + 1.2, S.pos.z + S.vel.z * 25);
          proiettili.push(proiettile(pn, bers.sub(pn).normalize().multiplyScalar(7), 0xff5a3a, false));
          bip(700, 0.08, 'square', 0.03);
        }
      }
      if (o._parti) {
        o._parti.anello.rotation.z += dt * (all ? 4 : 1.2);
        o._parti.corpo.position.y = 1.55 + o._quota;
        o._parti.occhio.emissiveIntensity = all ? 2.6 + Math.sin(ora / 80) * 0.6 : 1.2;
      }
    } else if (o.specie === 'automa') {
      /* cammina verso di te, poi si ferma, si carica e scatta */
      o._fase = o._fase || 'cammina';
      if (all) {
        if (o._fase === 'cammina') {
          mx = dx / d * 1.3 * dt * lento; mz = dz / d * 1.3 * dt * lento;
          if (d < 6 && vede && lento > 0) { o._fase = 'carica'; o._tf = 0.6; }
        } else if (o._fase === 'carica') {
          o._tf -= dt; if (o._tf <= 0) { o._fase = 'scatto'; o._tf = 0.7; o._dir = { x: dx / d, z: dz / d }; bip(220, 0.2, 'sawtooth', 0.05); }
        } else if (o._fase === 'scatto') {
          o._tf -= dt; mx = o._dir.x * 5 * dt * lento; mz = o._dir.z * 5 * dt * lento;
          if (o._tf <= 0) { o._fase = 'cammina'; }
        }
      }
      if (o._parti) {
        var passoA = (Math.abs(mx) + Math.abs(mz)) > 0.0005 ? ora / 160 : 0;
        o._parti.zampe.forEach(function (z, k) { z.anca.rotation.x = Math.sin(passoA + k * Math.PI) * 0.5; z.ginocchio.rotation.x = Math.max(0, -Math.sin(passoA + k * Math.PI)) * 0.7; });
        o._parti.braccia.forEach(function (b, k) { b.spalla.rotation.x = o._fase === 'carica' ? -1.4 : o._fase === 'scatto' ? -0.6 : Math.sin(passoA + k * Math.PI) * 0.4; });
        o._parti.occhio.emissiveIntensity = o._fase === 'carica' ? 4 + Math.sin(ora / 40) * 2 : all ? 2.6 : 1.2;
        o._parti.torso.rotation.y = Math.sin(ora / 700) * 0.1;
      }
    } else {
      /* il residuo: striscia verso di te e scatta da vicino */
      if (all) {
        var v = d < 2.6 ? 3.6 : 1.5;
        mx = dx / d * v * dt * lento; mz = dz / d * v * dt * lento;
      }
    }
    if (o._spinta) { mx += o._spinta.x; mz += o._spinta.z; o._spinta.x *= 0.85; o._spinta.z *= 0.85; if (Math.abs(o._spinta.x) + Math.abs(o._spinta.z) < 0.002) o._spinta = null; }
    var nx = o.x + mx, nz = o.z + mz;
    if (Math.abs(nx) < sx.larg / 2 - 0.6) o.x = nx;
    if (Math.abs(nz) < sx.prof / 2 - 0.6) o.z = nz;
    if (o._nodo) {
      o._nodo.position.set(o.x, 0, o.z);
      if (all) o._nodo.rotation.y = Math.atan2(dx, dz);
    }
    /* il lampo quando e' colpito */
    if (o._lampo > 0) {
      o._lampo -= dt * 5;
      (o._mat || []).forEach(function (m3) { if (m3.emissive) { m3.emissive.setRGB(o._lampo, o._lampo * 0.6, o._lampo * 0.3); } });
    }
    /* il contatto fa male (il residuo e l'automa) */
    if (o.specie !== 'drone' && d < (o.specie === 'automa' ? 1.0 : 0.85) && !S.immune && !(S.scudo > 0)) {
      danno(o.specie === 'automa' ? t('un automa ti ha travolto', 'an automaton ran you over')
                                  : t('un residuo corrosivo ti ha toccato', 'a corrosive residue touched you'));
    }
  }
  function animaMorti(dt) {
    if (!mondo) return;
    tuttiGliOggetti(function (o) {
      if (o.tipo !== 'nemico' || !(o._muore > 0) || !o._nodo) return;
      if (o._mod) {
        /* il modello: la clip della morte se c'e', se no cade e affonda */
        o._muore -= dt * (o._muoreClip ? 0.9 : 1.3);
        if (o._mod.mixer) o._mod.mixer.update(dt);
        if (!o._muoreClip) o._mod.corpo.rotation.x += (-1.45 - o._mod.corpo.rotation.x) * Math.min(1, dt * 6);
        if (o._muore < 0.4) o._nodo.position.y -= dt * 0.8;
        if (o._muore <= 0) o._nodo.visible = false;
        return;
      }
      o._muore -= dt * 2.5;
      o._nodo.scale.setScalar(Math.max(0.01, o._muore));
      o._nodo.position.y -= dt * 0.5;
      if (o._muore <= 0) o._nodo.visible = false;
    });
  }

  /* ── i modelli dei nemici ─────────────────────────────────────────── */
  var cacheNemici = {};
  function libreriaScheletri() {
    return new Promise(function (ok) {
      if (T.SkeletonUtils) return ok(true);
      var sc = document.createElement('script'); sc.src = './skeleton_utils.js';
      sc.onload = function () { ok(!!T.SkeletonUtils); }; sc.onerror = function () { ok(false); };
      document.head.appendChild(sc);
    });
  }
  function caricaNemico(nome) {
    if (!cacheNemici[nome]) cacheNemici[nome] = Promise.all([libreriaGLTF(), libreriaScheletri()]).then(function () {
      return fetch('models/nemici/' + nome + '.glb');
    }).then(function (r) { if (!r.ok) throw new Error(nome + ' HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function (b) { return analizza(b); })
      .then(function (gltf) {
        /* la misura: il riquadro nella posa di partenza */
        gltf.scene.updateMatrixWorld(true);
        var bb = new T.Box3();
        if (gltf.animations && gltf.animations.length) {
          /* con lo scheletro la posa di legame puo' essere sdraiata: si
             misura nella posa vera (il primo fotogramma della clip), dai
             vertici deformati dalle ossa */
          var mx0 = new T.AnimationMixer(gltf.scene);
          mx0.clipAction(gltf.animations[0]).play(); mx0.update(0.2);
          gltf.scene.updateMatrixWorld(true);
          var v = new T.Vector3();
          gltf.scene.traverse(function (o) {
            if (!o.isSkinnedMesh) { if (o.isMesh) { o.geometry.computeBoundingBox(); bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } return; }
            o.skeleton.update();
            var pos = o.geometry.attributes.position, passo = Math.max(1, Math.floor(pos.count / 1500));
            for (var i = 0; i < pos.count; i += passo) { v.fromBufferAttribute(pos, i); o.boneTransform(i, v); v.applyMatrix4(o.matrixWorld); bb.expandByPoint(v); }
          });
          mx0.stopAllAction(); mx0.uncacheRoot(gltf.scene);
        } else gltf.scene.traverse(function (o) { if (o.isMesh) { o.geometry.computeBoundingBox(); bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
        gltf.misura = bb;
        /* le braccia in T-pose dei modelli fermi (il bruto): si abbassano
           sulla geometria, una volta, ruotando i vertici oltre le spalle
           intorno alla spalla, con una sfumatura sull'articolazione */
        if (SPECIE_M[nome] && SPECIE_M[nome].abbassaBraccia) abbassaBraccia(gltf, bb, SPECIE_M[nome].abbassaBraccia);
        gltf.scene.traverse(function (o) {
          if (!o.isMesh) return;
          o.frustumCulled = false; o.castShadow = !ps1(); o.receiveShadow = false;
          var ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach(function (m) { m.envMapIntensity = 0.8; if (m.transparent && m.opacity > 0.9) m.transparent = false; });
        });
        return gltf;
      }).catch(function (e) { cacheNemici[nome] = null; animV.erroreNemici = String(e && e.message || e); return null; });
    return cacheNemici[nome];
  }
  function abbassaBraccia(gltf, bb, ang) {
    var w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, cx = (bb.min.x + bb.max.x) / 2;
    var sx = w * 0.17, sy = bb.min.y + h * 0.78, sfuma = w * 0.06;
    var v = new T.Vector3(), inv = new T.Matrix4();
    gltf.scene.traverse(function (o) {
      if (!o.isMesh || o.isSkinnedMesh) return;
      var pos = o.geometry.attributes.position, M = o.matrixWorld;
      inv.copy(M).invert();
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(M);
        var lato = v.x > cx ? 1 : -1, fuori = (v.x - cx) * lato - sx;
        if (fuori <= 0 || v.y < sy - h * 0.25) continue;
        var k = Math.min(1, fuori / sfuma), a = -lato * ang * k;
        var px = cx + lato * sx, dx = v.x - px, dy = v.y - sy;
        v.x = px + dx * Math.cos(a) - dy * Math.sin(a);
        v.y = sy + dx * Math.sin(a) + dy * Math.cos(a);
        v.applyMatrix4(inv);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      o.geometry.computeVertexNormals();
      o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere();
    });
  }
  /* IL RIG PROCEDURALE. I modelli senza scheletro si animano nella scheda
     grafica: ogni vertice, riportato nel riferimento del modello (in
     piedi, che guarda +z), si piega secondo dove sta — le gambe sotto
     l'anca ruotano avanti e indietro in opposizione, le braccia oltre le
     spalle oscillano col passo, si alzano per caricare e calano nel colpo,
     il busto si china nell'affondo e indietro quando incassa, respira; le
     forme senza gambe (l'abissale) ondeggiano come tentacoli. Le soglie
     sono nella forma umana: anca al 47% dell'altezza, spalle al 78% */
  var RIG_VS = [
    'uniform vec4 rigB0; uniform vec4 rigB1; uniform vec4 rigA; uniform vec4 rigC; uniform vec4 rigD; uniform mat4 rigM; uniform mat4 rigMi;',
    'vec3 rigRuota(vec3 p, vec3 c, float a){ vec3 d = p - c; float s = sin(a), k = cos(a); return c + vec3(d.x, d.y * k - d.z * s, d.y * s + d.z * k); }'
  ].join('\n');
  var RIG_BODY = [
    '{',
    '  vec3 p = (rigM * vec4(transformed, 1.0)).xyz;',
    '  float W = rigB1.x - rigB0.x, H = rigB1.y - rigB0.y, cx = (rigB0.x + rigB1.x) * 0.5, cz = (rigB0.z + rigB1.z) * 0.5;',
    '  float h = (p.y - rigB0.y) / H, lato = sign(p.x - cx + 1e-5), dx = abs(p.x - cx) / W;',
    /* le gambe */
    '  float gamba = (1.0 - smoothstep(0.40, 0.52, h)) * smoothstep(0.015, 0.06, dx) * (1.0 - rigC.y);',
    '  float aG = lato * sin(rigA.x) * rigA.y * 0.6;',
    '  vec3 q = rigRuota(p, vec3(p.x, rigB0.y + H * 0.47, cz), aG);',
    '  float gin = gamba * (1.0 - smoothstep(0.12, 0.26, h)) * max(0.0, -lato * sin(rigA.x)) * rigA.y;',
    '  q = rigRuota(q, vec3(q.x, rigB0.y + H * 0.24, cz), gin * 0.9);',
    '  p = mix(p, q, gamba);',
    /* le braccia */
    '  float br = smoothstep(0.19, 0.29, dx) * smoothstep(0.30, 0.48, h) * (1.0 - smoothstep(0.86, 0.95, h));',
    '  float aB = -lato * sin(rigA.x) * rigA.y * 0.45 - rigA.z * 0.95 + rigA.w * 0.75 - rigC.x * 0.45;',
    '  p = mix(p, rigRuota(p, vec3(p.x, rigB0.y + H * 0.78, cz + (rigB1.z - rigB0.z) * 0.05), aB * rigD.x), br);',
    /* il busto */
    '  float bu = smoothstep(0.42, 0.62, h);',
    '  p = mix(p, rigRuota(p, vec3(p.x, rigB0.y + H * 0.47, cz), rigA.w * 0.32 - rigA.z * 0.14 - rigC.x * 0.45 + rigC.z), bu);',
    '  p.xz += (p.xz - vec2(cx, cz)) * rigC.w * bu;',
    /* i tentacoli */
    '  float ten = rigC.y * (1.0 - smoothstep(0.0, 0.55, h));',
    '  p.x += sin(h * 13.0 - rigA.x * 1.7 + p.z * 4.0) * ten * W * 0.09;',
    '  p.z += cos(h * 11.0 - rigA.x * 1.3 + p.x * 3.0) * ten * W * 0.07;',
    '  transformed = (rigMi * vec4(p, 1.0)).xyz;',
    '}'
  ].join('\n');
  function rigProcedurale(copia, bb, tentacoli, braccia) {
    var unif = {
      rigB0: { value: new T.Vector4(bb.min.x, bb.min.y, bb.min.z, 0) },
      rigB1: { value: new T.Vector4(bb.max.x, bb.max.y, bb.max.z, 0) },
      rigA: { value: new T.Vector4(0, 0, 0, 0) },                /* fase del passo, ampiezza, braccia alzate, colpo */
      rigC: { value: new T.Vector4(0, tentacoli ? 1 : 0, 0, 0) }, /* ferito, tentacoli, chinarsi, respiro */
      rigD: { value: new T.Vector4(braccia == null ? 1 : braccia, 0, 0, 0) }  /* quanto si muovono le braccia (le forme a quattro zampe: niente) */
    };
    copia.updateMatrixWorld(true);
    var inv = new T.Matrix4().copy(copia.matrixWorld).invert();
    copia.traverse(function (m) {
      if (!m.isMesh || m.isSkinnedMesh) return;
      var M = new T.Matrix4().multiplyMatrices(inv, m.matrixWorld), Mi = M.clone().invert();
      var mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach(function (mt) {
        var prima = mt.onBeforeCompile;
        mt.onBeforeCompile = function (sh, r) {
          if (prima) prima.call(this, sh, r);
          sh.uniforms.rigB0 = unif.rigB0; sh.uniforms.rigB1 = unif.rigB1; sh.uniforms.rigA = unif.rigA; sh.uniforms.rigC = unif.rigC; sh.uniforms.rigD = unif.rigD;
          sh.uniforms.rigM = { value: M }; sh.uniforms.rigMi = { value: Mi };
          sh.vertexShader = RIG_VS + '\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + RIG_BODY);
        };
        var kPrima = mt.hasOwnProperty('customProgramCacheKey') ? mt.customProgramCacheKey : null;
        mt.customProgramCacheKey = function () { return 'rig1' + (kPrima ? kPrima.call(this) : ''); };   /* un programma per tutti: cambiano solo le uniform */
        mt.needsUpdate = true;
      });
      m.frustumCulled = false;
    });
    return unif;
  }
  /* LA LUCE DI CONTORNO: nel buio la sagoma della creatura si stacca dal
     fondo con un filo di luce sui bordi (dove la superficie gira via dallo
     sguardo), appena del suo colore — come la pelle bagnata sotto una
     lampada alle spalle */
  function luceDiContorno(mats, col) {
    var rc = { value: new T.Color(col).lerp(new T.Color(0xcfd8e0), 0.5).multiplyScalar(0.55) };
    mats.forEach(function (mt) {
      if (!mt.isMeshStandardMaterial) return;
      var prima = mt.onBeforeCompile;
      mt.onBeforeCompile = function (sh, r2) {
        if (prima) prima.call(this, sh, r2);
        sh.uniforms.rimCol = rc;
        sh.fragmentShader = 'uniform vec3 rimCol;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n  { float fr = 1.0 - abs(dot(normal, normalize(vViewPosition))); totalEmissiveRadiance += rimCol * pow(fr, 3.0); }');
      };
      mt.customProgramCacheKey = function () { return 'rim1'; };
      mt.needsUpdate = true;
    });
  }
  function montaModelloNemico(o, g) {
    var SM = SPECIE_M[o.specie];
    if (typeof fetch === 'undefined') return;
    caricaNemico(SM.modello).then(function (gltf) {
      if (!gltf || !o._nodo || o._nodo !== g || !g.parent) return;
      var anim = gltf.animations && gltf.animations.length && T.SkeletonUtils;
      var copia = anim ? T.SkeletonUtils.clone(gltf.scene) : gltf.scene.clone(true);
      var V = variante(o), colV = coloreDi(o);
      var bb = gltf.misura, alto = Math.max(0.01, bb.max.y - bb.min.y), k = SM.alto * V.scala / alto;
      var cont = new T.Group(), corpo = new T.Group();
      copia.scale.setScalar(k);
      copia.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k + (SM.quota || 0), -(bb.min.z + bb.max.z) / 2 * k);
      corpo.add(copia); cont.add(corpo);
      /* i materiali propri, per il lampo quando e' colpito */
      var mats = [];
      copia.traverse(function (m) {
        if (!m.isMesh) return;
        m.material = Array.isArray(m.material) ? m.material.map(function (x) { var c = x.clone(); mats.push(c); return c; }) : m.material.clone();
        if (!Array.isArray(m.material)) mats.push(m.material);
      });
      /* la tinta della variante: la pelle prende il gelo o il calore, e
         l'elite un riflesso d'oro che pulsa */
      mats.forEach(function (m) {
        if (V.tinta && m.color) m.color.lerp(new T.Color(V.tinta), 0.32);
        if (m.emissive) {
          if (V.tinta) m.emissive.lerp(new T.Color(V.tinta).multiplyScalar(0.25), 0.6);
          if (V.elite) m.emissive.add(new T.Color(0x3a2a00));
          m.userData.em0 = m.emissive.clone();
        }
      });
      /* gli occhi: un alone del colore della variante */
      if (!ps1()) luceDiContorno(mats, colV);
      var oc = G.alone ? G.alone(colV, 0.22 + SM.alto * 0.04, 0.3) : null;
      if (oc) { oc.position.set(0, SM.alto * V.scala * 0.86 + (SM.quota || 0), SM.raggio * V.scala * 0.55); corpo.add(oc); }
      if (V.elite && G.alone) { var aur = G.alone(0xffd24a, SM.alto * V.scala * 1.4, 0.18); aur.position.y = SM.alto * V.scala * 0.5; corpo.add(aur); }
      var mod = { cont: cont, corpo: corpo, copia: copia, mats: mats, occhi: oc, k: k };
      if (anim) {
        mod.mixer = new T.AnimationMixer(copia); mod.azioni = {};
        gltf.animations.forEach(function (c) { mod.azioni[c.name] = mod.mixer.clipAction(c); });
        mod.attuale = null;
      }
      if (o._segnaposto) { g.remove(o._segnaposto); o._segnaposto = null; }
      g.add(cont);
      o._mod = mod; o._mat = mats;
      animaClip(o, 'idle');
      if (mod.mixer) mod.mixer.update(0.2);      /* subito in posa: mai la posa di legame */
      else mod.rig = rigProcedurale(copia, gltf.misura, SM.modo === 'fluttua', SM.rigBraccia);
    });
  }
  /* la clip di un'azione (se il modello l'ha): si passa con una dissolvenza */
  function animaClip(o, cosa, una) {
    var mod = o._mod, SM = SPECIE_M[o.specie];
    if (!mod || !mod.mixer) return false;
    var nome = (SM.anim && SM.anim[cosa]) || null;
    if (!nome || !mod.azioni[nome]) {
      var primo = Object.keys(mod.azioni)[0];
      if (!mod.attuale && primo) { mod.azioni[primo].play(); mod.attuale = mod.azioni[primo]; }
      return false;
    }
    var az = mod.azioni[nome];
    if (mod.attuale === az && !una) return true;
    az.reset(); az.setLoop(una ? T.LoopOnce : T.LoopRepeat, Infinity); az.clampWhenFinished = !!una;
    az.timeScale = cosa === 'corsa' && SM.anim.corsa === SM.anim.passo ? 1.6 : 1;
    az.play();
    if (mod.attuale && mod.attuale !== az) mod.attuale.crossFadeTo(az, 0.18, false);
    mod.attuale = az;
    return true;
  }

  /* IL NEMICO DAL MODELLO: insegue, attacca secondo la specie, reagisce
     ai colpi. Gli attacchi si annunciano (il corpo si carica, gli occhi
     si accendono) e colpiscono alla fine: chi si sposta in tempo li schiva */
  function aggiornaNemicoM(o, sx, st, ora) {
    var dt = PASSO / 1000, SM = SPECIE_M[o.specie], V = variante(o), colV = coloreDi(o);
    o.t = (o.t || 0) + 1;
    var ip = o._ip || (o._ip = {});
    ip.x0 = o.x; ip.z0 = o.z; ip.y0 = ip.y1 == null ? 0 : ip.y1; ip.r0 = ip.r1 == null ? (o._nodo ? o._nodo.rotation.y : 0) : ip.r1;
    var wx = sx.x + o.x, wz = sx.z + o.z;
    var dx = S.pos.x - wx, dz = S.pos.z - wz, d = Math.hypot(dx, dz) || 1;
    var vede = sx === st && d < 14 && vistaLibera(wx, wz, S.pos.x, S.pos.z);
    if (vede) o._allerta = 5; else if (o._allerta > 0) o._allerta -= dt;
    var all = o._allerta > 0 && sx === st;
    var lento = (o._gelo > 0 ? 0.3 : 1) * V.vel;
    if (o._gelo > 0) o._gelo -= dt;
    if (o._stordito > 0) { o._stordito -= dt; lento = 0; }
    if (o._crollo > 0) { o._crollo -= dt; lento = 0; }
    /* chi arriva con l'orda risale dal pavimento */
    if (o._emerge > 0) {
      o._emerge -= dt; lento = 0; o._allerta = 5;
      o._quotaSalto = -2.6 * Math.max(0, o._emerge) / 1.2;
      if (o._emerge <= 0) o._quotaSalto = 0;
    }
    o._fase = o._fase || 'attesa';
    o._cd = Math.max(0, (o._cd || 0) - dt);
    o._cdS = o._cdS == null ? 3 + ((o.t * 7 + o.x * 13) % 4) : Math.max(0, o._cdS - dt);
    var mx = 0, mz = 0, ux = dx / d, uz = dz / d;
    var vai = function (v) { mx = ux * v * dt * lento; mz = uz * v * dt * lento; };
    var SPc = SPECIALI[o.specie];
    if (o._fase === 'speciale' && o._sp) {
      /* l'attacco speciale: stordito mentre si carica, lo perde */
      if (lento === 0 && o._sp.fase === 'carica') { o._sp = null; o._fase = 'insegui'; }
      else { var rs = passoSpeciale(o, sx, SM, V, colV, d, ux, uz, wx, wz, dt); mx = rs.mx; mz = rs.mz; }
    }
    else if (!all) { o._fase = 'attesa'; }
    else if (o._fase === 'attesa' || o._fase === 'insegui') {
      o._fase = 'insegui';
      if (SPc && o._cdS <= 0 && vede && lento > 0 && d > SPc.da && d < SPc.a) {
        o._fase = 'speciale'; o._sp = { fase: 'carica', t: 0 };
        o._cdS = SPc.cd * V.cd * (0.8 + Math.random() * 0.4);
        ringhio(o, SPc.carica + 0.4, true);
      } else if (SM.modo === 'sputo' || SM.modo === 'fluttua') {
        /* a distanza: si avvicina o si allontana, gira intorno, spara */
        var ideale = SM.modo === 'sputo' ? 6.5 : 5.5, rad = d > ideale + 1 ? 1 : d < ideale - 1.5 ? -1 : 0;
        var lato = Math.sin(o.t * 0.008 + o.x * 2) > 0 ? 1 : -1;
        mx = (ux * rad - uz * lato * 0.5) * SM.vel * dt * lento; mz = (uz * rad + ux * lato * 0.5) * SM.vel * dt * lento;
        if (o._cd <= 0 && vede && lento > 0) { o._fase = 'carica'; o._tf = 0.55; }
      } else if (SM.modo === 'salto') {
        if (d > 6.5) vai(SM.vel); else if (o._cd <= 0 && vede && lento > 0) { o._fase = 'carica'; o._tf = 0.5; } else vai(SM.vel * 0.5);
      } else if (SM.modo === 'carica') {
        if (d > SM.portata && !(d < 6 && o._cd <= 0)) vai(SM.vel);
        if (d < 6 && o._cd <= 0 && vede && lento > 0) { o._fase = 'carica'; o._tf = 0.65; }
      } else {
        if (d > SM.portata * 0.8) vai(d < 4 ? SM.vel * 1.4 : SM.vel);
        if (d < SM.portata + 0.2 && o._cd <= 0 && lento > 0) { o._fase = 'carica'; o._tf = 0.42; }
      }
    } else if (o._fase === 'carica') {
      /* il colpo in arrivo: si vede */
      o._tf -= dt * (lento || 0.0001);
      if (o._tf <= 0) {
        o._fase = 'colpo'; o._tf = SM.modo === 'carica' ? 0.75 : SM.modo === 'salto' ? 0.6 : 0.25;
        o._dir = { x: ux, z: uz };
        if (SM.modo === 'salto') o._salto = { da: { x: o.x, z: o.z }, a: { x: o.x + dx * 0.9, z: o.z + dz * 0.9 }, t: 0 };
        if (SM.modo === 'sputo' || SM.modo === 'fluttua') {
          var pn = posNemico(o); pn.y = SM.alto * 0.8 + (SM.quota || 0);
          var bers = new T.Vector3(S.pos.x + S.vel.x * 20, S.pos.y + 1.2, S.pos.z + S.vel.z * 20);
          var n = SM.modo === 'fluttua' ? 3 + V.extra * 2 : 1 + V.extra;
          for (var i = 0; i < n; i++) {
            var dir = bers.clone().sub(pn).normalize();
            if (n > 1) dir.applyAxisAngle(new T.Vector3(0, 1, 0), (i - (n - 1) / 2) * (SM.modo === 'fluttua' ? 0.16 : 0.09));
            var pr = proiettile(pn.clone(), dir.multiplyScalar((SM.modo === 'sputo' ? 8 : 6.5) * (1 + 0.1 * (V.atto - 1))), colV, false);
            if (SM.modo === 'sputo') { pr.v.y += 2.2; pr.g = 4.5; }
            pr.fonte = { x: wx, z: wz }; pr.nome = SM.nome;
            proiettili.push(pr);
          }
          bip(SM.modo === 'sputo' ? 180 : 620, 0.12, 'sawtooth', 0.04);
        } else bip(140, 0.15, 'sawtooth', 0.05);
      }
    } else if (o._fase === 'colpo') {
      o._tf -= dt;
      if (SM.modo === 'carica') { mx = o._dir.x * 5.2 * dt * lento; mz = o._dir.z * 5.2 * dt * lento; }
      else if (SM.modo === 'salto' && o._salto) {
        o._salto.t += dt / 0.6; var kk = Math.min(1, o._salto.t);
        mx = o._salto.da.x + (o._salto.a.x - o._salto.da.x) * kk - o.x; mz = o._salto.da.z + (o._salto.a.z - o._salto.da.z) * kk - o.z;
        o._quotaSalto = Math.sin(kk * Math.PI) * 1.4;
      } else if (SM.modo === 'mischia') { mx = ux * 1.2 * dt; mz = uz * 1.2 * dt; }
      /* il colpo arriva: se sei ancora a portata (e senza scudo), fa male */
      var arriva = (SM.modo === 'mischia' && o._tf <= 0.12 && !o._colpito) || (SM.modo !== 'mischia' && SM.modo !== 'sputo' && SM.modo !== 'fluttua' && !o._colpito);
      if (arriva && d < SM.portata * V.scala + (SM.modo === 'salto' ? 0.4 : 0.3) && !S.immune && !(S.scudo > 0)) {
        o._colpito = true;
        danno(SM.nome[lingua() === 'en' ? 1 : 0] + t(' ti ha colpito', ' hit you'), { x: wx, z: wz });
      }
      if (o._tf <= 0) {
        o._colpito = false; o._quotaSalto = 0;
        /* la COMBINAZIONE: dal secondo atto (e le elite) chi colpisce in
           mischia o carica ripete subito, una o due volte */
        o._combo = (o._combo || 0) + 1;
        if ((SM.modo === 'mischia' || SM.modo === 'carica') && o._combo <= V.extra && d < 7) { o._fase = 'carica'; o._tf = 0.3; }
        else { o._combo = 0; o._fase = 'insegui'; o._cd = (SM.modo === 'carica' ? 2.2 : SM.modo === 'salto' ? 2.6 : SM.modo === 'mischia' ? 1.1 : 2.4) * V.cd; }
      }
    }
    if (o._spinta) { mx += o._spinta.x; mz += o._spinta.z; o._spinta.x *= 0.85; o._spinta.z *= 0.85; if (Math.abs(o._spinta.x) + Math.abs(o._spinta.z) < 0.002) o._spinta = null; }
    var nx = o.x + mx, nz = o.z + mz;
    if (Math.abs(nx) < sx.larg / 2 - 0.6) o.x = nx;
    if (Math.abs(nz) < sx.prof / 2 - 0.6) o.z = nz;
    /* LA DISTANZA DAL CORPO: una creatura a terra non entra mai nel
       giocatore (la telecamera finirebbe dentro il modello): si ferma a un
       palmo dal suo raggio. In aria (il balzo) o sotto il pavimento no */
    var qS = o._quotaSalto || 0;
    if (sx === st && !o._nascosto && qS < 0.8 && qS > -0.5) {
      var ex = sx.x + o.x - S.pos.x, ez = sx.z + o.z - S.pos.z, ed = Math.hypot(ex, ez), minD = SM.raggio * V.scala + 0.5;
      if (ed < minD) {
        if (ed < 0.01) { ex = -Math.sin(S.ang); ez = -Math.cos(S.ang); ed = 1; }
        var px2 = S.pos.x + ex / ed * minD - sx.x, pz2 = S.pos.z + ez / ed * minD - sx.z;
        if (Math.abs(px2) < sx.larg / 2 - 0.6) o.x = px2;
        if (Math.abs(pz2) < sx.prof / 2 - 0.6) o.z = pz2;
      }
    }
    var muove = Math.hypot(mx, mz) / dt;
    if (o._fase === 'carica' && o._fasePrec !== 'carica') ringhio(o, 0.45, false);
    else if (all && o._fase === 'insegui' && Math.random() < dt * 0.06) ringhio(o, 0.9, false);
    o._fasePrec = o._fase;
    var spC = o._fase === 'speciale' && o._sp && o._sp.fase === 'carica', spV = o._fase === 'speciale' && o._sp && o._sp.fase === 'via';
    if (o._nodo) {
      ip.y1 = o._quotaSalto || 0;
      var att = ip.r0;
      if (all && o._fase !== 'colpo') {
        var vuole = Math.atan2(dx, dz);
        var dd = Math.atan2(Math.sin(vuole - att), Math.cos(vuole - att));
        att += dd * Math.min(1, dt * 7);
      }
      ip.r1 = att;
      if (ps1()) { o._nodo.position.set(o.x, ip.y1, o.z); o._nodo.rotation.y = att; }
    }
    /* la posa: le clip se ci sono; se no il corpo respira, cammina
       ondeggiando, si carica all'indietro e si lancia avanti */
    var mod = o._mod;
    if (mod) {
      var conClip = !!mod.mixer;
      if (conClip) {
        if (o._ferito > 0 && animaClip(o, 'ferito', true)) {}
        else if (o._fase === 'carica' || o._fase === 'colpo' || spC) { if (!animaClip(o, 'attacco', o._fase === 'carica' || spC)) animaClip(o, 'corsa'); }
        else if (spV) animaClip(o, 'corsa');
        else if (muove > 1.6) animaClip(o, 'corsa'); else if (muove > 0.1) animaClip(o, 'passo'); else animaClip(o, 'idle');
        mod.mixer.update(dt * (lento || 0.15));
      }
      var c = mod.corpo, f = ora / 1000 + o.t * 0.01;
      var respiro = Math.sin(f * 2.2) * 0.02, ond = muove > 0.1 ? Math.sin(o._fasePasso || 0) : 0;
      var carica = o._fase === 'carica' || spC ? 1 : 0, colpo = o._fase === 'colpo' || spV ? 1 : 0;
      if (mod.rig) {
        /* il rig nello shader: il passo avanza con la strada fatta (non col
           tempo), le braccia salgono nella carica e calano nel colpo con
           una curva morbida, il colpo subito arretra il busto */
        var A4 = mod.rig.rigA.value, C4 = mod.rig.rigC.value;
        o._fasePasso = (o._fasePasso || 0) + muove * dt * (5.2 / Math.max(0.8, SM.alto));
        var ampV = Math.min(1, muove / Math.max(0.6, SM.vel * 0.8));
        A4.x = o._fasePasso;
        A4.y += (ampV - A4.y) * Math.min(1, dt * 8);
        A4.z += ((carica ? 1 : 0) - A4.z) * Math.min(1, dt * (carica ? 7 : 16));
        A4.w += ((colpo ? 1 : 0) - A4.w) * Math.min(1, dt * (colpo ? 18 : 5));
        C4.x = Math.max(0, o._ferito || 0);
        C4.z = (SM.modo === 'salto' || (spC && (o.specie === 'bruto' || o.specie === 'curvo'))) && carica ? 0.3 : 0;
        C4.w = respiro * 0.6;
      }
      c.scale.set(1 + respiro * 0.3, 1 + respiro * 0.5, 1 + respiro * 0.3);
      /* a terra: il colpo pesante lo butta all'indietro, poi si rialza */
      var aTerra = o._crollo > 0.35 ? 1 : 0;
      c.rotation.x += ((conClip ? 0 : colpo * 0.1) + (o._ferito > 0 ? -0.18 * o._ferito : 0) - aTerra * 1.25 - c.rotation.x) * Math.min(1, dt * (aTerra ? 9 : 5));
      c.rotation.z = conClip ? 0 : ond * 0.035;
      c.position.y = (conClip ? 0 : Math.abs(ond) * 0.035 + (SM.modo === 'fluttua' ? Math.sin(f * 1.6) * 0.15 : 0)) - Math.max(0, -c.rotation.x) * 0.25;
      if (mod.occhi) {
        /* gli occhi: si accendono nella carica; chi si puo' finire lampeggia bianco */
        var es = eseguibile(o) && d < 6;
        mod.occhi.material.opacity = es ? 0.45 + Math.sin(ora / 70) * 0.35 : carica ? 0.5 + Math.sin(ora / 40) * 0.3 : all ? 0.35 : 0.15;
        mod.occhi.material.color.setHex(es ? 0xffffff : colV);
        mod.occhi.scale.setScalar((0.22 + SM.alto * 0.04) * V.scala * (1 + carica * 1.2 + (es ? 0.6 : 0)));
      }
    } else if (o._segnaposto) {
      o._segnaposto.rotation.x = o._fase === 'carica' ? -0.25 : o._fase === 'colpo' ? 0.3 : 0;
    }
    if (o._ferito > 0) o._ferito -= dt * 3;
    /* il lampo quando e' colpito */
    if (o._lampo > 0) {
      o._lampo -= dt * 5;
      (o._mat || []).forEach(function (m3) { if (m3.emissive) { var e0 = m3.userData.em0; m3.emissive.setRGB((e0 ? e0.r : 0) + o._lampo, (e0 ? e0.g : 0) + o._lampo * 0.5, (e0 ? e0.b : 0) + o._lampo * 0.3); } });
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE ORDE. Dal sesto livello, un livello su tre ha una stanza-trappola:
     entrando le porte si bloccano, la luce d'allarme gira, la sirena
     suona, e le creature del livello risalgono dal pavimento a ondate
     (due nell'atto I, di piu' dopo). Si esce solo dopo averle abbattute
     tutte; la ricompensa e' salute, energia piena e punti. Le creature
     dell'orda non si salvano: un'orda respinta non torna
     ═════════════════════════════════════════════════════════════════════════ */
  function scegliOrda(liv, n) {
    if (n < 6 || n % 3 !== 0) return;
    var specie = [], atto = 1;
    liv.stanze.forEach(function (st) { (st.oggetti || []).forEach(function (o) {
      if (o.tipo === 'nemico' && SPECIE_M[o.specie]) { if (specie.indexOf(o.specie) < 0) specie.push(o.specie); atto = Math.max(atto, o.atto || 1); }
    }); });
    if (!specie.length) return;
    var cand = liv.stanze.filter(function (st, i) {
      return i > 0 && st.larg >= 7 && st.prof >= 7 && !(st.oggetti || []).some(function (o) { return ['uscita', 'boss', 'banco', 'portaLab', 'salvataggio'].indexOf(o.tipo) >= 0; });
    });
    if (!cand.length) return;
    var st = cand[(n * 7) % cand.length];
    st._orda = { ondate: 2 + (atto - 1) + (n >= 150 ? 1 : 0), ondata: 0, finita: !!(S && S.presi['orda:' + st.id]), specie: specie, atto: atto, pausa: 0 };
  }
  function dentroOrda(x, z) {
    var st = S.orda;
    if (!st) return true;
    return Math.abs(x - st.x) < st.larg / 2 - 0.45 && Math.abs(z - st.z) < st.prof / 2 - 0.45;
  }
  function passoOrda(st) {
    if (S.lab || S.finito) return;
    var dt = PASSO / 1000;
    if (S.orda) {
      var A = S.orda, O = A._orda, vivi = 0;
      (A.oggetti || []).forEach(function (o) { if (o._orda === O.ondata && o.vivo) vivi++; });
      if (vivi > 0) return;
      if (O.pausa <= 0) O.pausa = 2.2;
      O.pausa -= dt;
      if (O.pausa > 0.01) return;
      O.pausa = 0;
      if (O.ondata < O.ondate) { ondataOrda(A); return; }
      /* respinta */
      O.finita = true; S.orda = null; S.presi['orda:' + A.id] = true;
      S.vite = Math.min(S.vitaMax, S.vite + 1); S.energia = 100; S.punti += 300;
      avviso(t('✓ Orda respinta', '✓ Horde repelled'), t('le porte si riaprono · +1 salute · energia piena · +300', 'the doors reopen · +1 health · full energy · +300'));
      bip(523, 0.2, 'triangle', 0.07); setTimeout(function () { bip(784, 0.3, 'triangle', 0.07); }, 180);
      return;
    }
    if (st && st._orda && !st._orda.finita && Math.abs(S.pos.x - st.x) < st.larg / 2 - 1.3 && Math.abs(S.pos.z - st.z) < st.prof / 2 - 1.3) {
      S.orda = st;
      avviso('⚠ ' + t('ORDA', 'HORDE'), t('le porte si sono bloccate: abbattile tutte', 'the doors have locked: take them all down'));
      sirena(); scossa = Math.max(scossa, 0.6);
      ondataOrda(st);
    }
  }
  function ondataOrda(st) {
    var O = st._orda;
    O.ondata++;
    var quanti = Math.min(7, 2 + O.ondata + (O.atto - 1));
    for (var i = 0; i < quanti; i++) {
      /* dove: lontano da chi gioca, dentro la stanza, sparpagliati */
      var x = 0, z = 0;
      for (var tN = 0; tN < 12; tN++) {
        x = (Math.random() - 0.5) * (st.larg - 2.2); z = (Math.random() - 0.5) * (st.prof - 2.2);
        if (Math.hypot(st.x + x - S.pos.x, st.z + z - S.pos.z) > 3.6) break;
      }
      var o = { tipo: 'nemico', specie: O.specie[(i + O.ondata) % O.specie.length], x: x, z: z, atto: O.atto, elite: O.ondata === O.ondate && i === 0, _orda: O.ondata };
      var k = st.oggetti.length;
      st.oggetti.push(o);
      var nodo = costruisciOggetto(o, st, k, mondo.zona.zona ? mondo.zona.zona.n : 1, mondo.livello.n);
      o._chiave = null; o._emerge = 1.2 + i * 0.25; o._quotaSalto = -2.6; o._allerta = 5;
      nodo.userData.mobile = true;
      st._g.add(nodo);
      scintille(new T.Vector3(st.x + x, 0.2, st.z + z), 0x3a2a1a, 12);
      if (conSangue()) pozzaSotto(new T.Vector3(st.x + x, 0, st.z + z), 0.9);
    }
    if (O.ondata > 1) avviso(t('Ondata ', 'Wave ') + O.ondata + '/' + O.ondate);
    tonfo(50, 0.6);
  }
  function sirena() {
    var A = contesto(); if (!A) return;
    try {
      var o = A.createOscillator(), g = A.createGain(), t0 = A.currentTime;
      o.type = 'sawtooth';
      for (var i = 0; i < 4; i++) { o.frequency.setValueAtTime(520, t0 + i * 0.9); o.frequency.linearRampToValueAtTime(880, t0 + i * 0.9 + 0.45); o.frequency.linearRampToValueAtTime(520, t0 + i * 0.9 + 0.9); }
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.1); g.gain.setValueAtTime(0.045, t0 + 3.4); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.6);
      var f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.5;
      o.connect(f); f.connect(g); g.connect(A.destination); o.start(t0); o.stop(t0 + 3.7);
    } catch (e) {}
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LE MOSSE DEL GIOCATORE
     ═════════════════════════════════════════════════════════════════════════ */
  /* IL CORPO A CORPO: tre colpi in fila se si preme a tempo — il jab
     sinistro, il gancio col calcio della pistola, il diretto pesante che
     butta a terra. Ogni colpo che entra ferma il tempo un istante (si
     sente il peso) e spinge il bersaglio */
  var COMBO = [
    { clip: 'Punch_sx', vel: 1.9, danno: 2, spinta: 0.06, stordito: 0.45, attesa: 0.26, fermo: 0.045, portata: 2.4 },
    { clip: 'Punch_2', vel: 1.8, danno: 2, spinta: 0.07, stordito: 0.6, attesa: 0.3, fermo: 0.055, portata: 2.4 },
    { clip: 'Punch', vel: 1.35, danno: 4, spinta: 0.16, stordito: 1.3, attesa: 0.6, fermo: 0.1, portata: 2.7, crollo: true }
  ];
  function pugno() {
    if (!S || schermo !== 'gioco' || S.finito || (CD.pugno || 0) > 0 || mosse.esegui) return;
    /* davanti c'e' un nemico che barcolla: il pugno diventa l'esecuzione */
    if (esecuzione()) return;
    mosse.combo = mosse.finestra > 0 ? (mosse.combo % 3) + 1 : 1;
    mosse.finestra = 0.9;
    var C = COMBO[mosse.combo - 1];
    CD.pugno = C.attesa;
    animV.prendi = 0;
    if (vista && vista.rig) vista.rig.colpo(C.clip, C.vel);
    else animV.lancio = 1;
    mosse.affondo = Math.max(mosse.affondo, C.crollo ? 0.16 : 0.07);
    var orig = camera.getWorldPosition(new T.Vector3()), dir = camera.getWorldDirection(new T.Vector3());
    var dd = new T.Vector3(dir.x, 0, dir.z).normalize();
    var colpito = false;
    nemiciVivi(C.portata, new T.Vector3(S.pos.x, 1, S.pos.z)).forEach(function (n) {
      var v = n.p.clone().sub(orig); v.y = 0; v.normalize();
      if (v.dot(dd) < 0.5) return;
      colpito = true;
      setTimeout(function () {
        if (!n.o.vivo) return;
        ferisci(n.o, C.danno, null, n.p);
        n.o._spinta = { x: dd.x * C.spinta, z: dd.z * C.spinta }; n.o._ferito = 1;
        n.o._stordito = Math.max(n.o._stordito || 0, C.stordito);
        if (C.crollo) n.o._crollo = 1.3;
        /* la carica del nemico s'interrompe: un pugno a tempo e' una difesa */
        if (n.o._fase === 'carica') { n.o._fase = 'insegui'; n.o._cd = Math.max(n.o._cd || 0, 0.8); }
        sangue(n.p, coloreDi(n.o), C.crollo ? 18 : 9, dd);
        fermaTempo(C.fermo);
        scossa = Math.max(scossa, C.crollo ? 0.55 : 0.3);
        tonfo(C.crollo ? 70 : 110, C.crollo ? 0.35 : 0.18);
      }, 110);
    });
    fruscio(0.12, 900, 2400, colpito ? 0.03 : 0.05);
  }

  /* L'ESECUZIONE: un nemico stordito, a terra o quasi morto, davanti e
     vicino, si finisce con una sequenza — il tempo rallenta, la testa si
     avvicina, due colpi, poi il corpo cede. Rende energia e salute */
  function eseguibile(o) {
    if (!o || !o.vivo || !SPECIE_M[o.specie]) return false;
    var max = specieDi(o).vita;
    return (o._stordito || 0) > 1.0 || (o._crollo || 0) > 0 || (o.vita != null && o.vita <= Math.max(1, max * 0.3));
  }
  function bersaglioEsecuzione() {
    if (!S || !mondo || S.lab || !camera) return null;
    var dir = camera.getWorldDirection(new T.Vector3()), dd = new T.Vector3(dir.x, 0, dir.z).normalize();
    var mi = null, md = 2.7;
    nemiciVivi(2.7, new T.Vector3(S.pos.x, 1, S.pos.z)).forEach(function (n) {
      if (!eseguibile(n.o)) return;
      var v = n.p.clone().sub(new T.Vector3(S.pos.x, n.p.y, S.pos.z)), l = v.length();
      if (v.normalize().dot(dd) < 0.45 || l > md) return;
      md = l; mi = n;
    });
    return mi;
  }
  function esecuzione() {
    var n = bersaglioEsecuzione();
    if (!n) return false;
    mosse.esegui = { o: n.o, p: n.p.clone(), t: 0, fase: 0 };
    n.o._stordito = 3; n.o._fase = 'attesa';
    rallenta(0.75);
    S.immune = Math.max(S.immune, 90);
    if (vista && vista.rig) vista.rig.colpo('Punch_sx', 1.6);
    fruscio(0.2, 400, 1600, 0.05);
    return true;
  }
  function passoEsecuzione(dtR) {
    var E = mosse.esegui;
    if (!E) return;
    E.t += dtR;
    /* lo sguardo va sul bersaglio */
    var vuole = Math.atan2(-(E.p.x - S.pos.x), -(E.p.z - S.pos.z));
    S.ang += Math.atan2(Math.sin(vuole - S.ang), Math.cos(vuole - S.ang)) * Math.min(1, dtR * 12);
    S.angY += (-0.12 - S.angY) * Math.min(1, dtR * 8);
    mosse.affondo += (0.42 - mosse.affondo) * Math.min(1, dtR * 10);
    if (E.fase === 0 && E.t > 0.22) {
      E.fase = 1;
      if (vista && vista.rig) vista.rig.colpo('Punch_2', 1.7);
      sangue(E.p, coloreDi(E.o), 10, null); tonfo(120, 0.15); fermaTempo(0.06);
    } else if (E.fase === 1 && E.t > 0.5) {
      E.fase = 2;
      if (vista && vista.rig) vista.rig.colpo('Punch', 1.4);
    } else if (E.fase === 2 && E.t > 0.68) {
      E.fase = 3;
      var o = E.o;
      if (o.vivo) {
        o._crollo = 2;
        ferisci(o, 999, null, E.p);
        sangue(E.p, coloreDi(o), 40, camera.getWorldDirection(new T.Vector3()));
        luceLampo(E.p, coloreDi(o), 4, 0.4);
        S.energia = Math.min(100, (S.energia || 0) + 35);
        S.punti += 50;
        if (S.vite < S.vitaMax) S.vite++;
        avviso(t('☠ Esecuzione', '☠ Execution'), t('+35 energia · +1 salute', '+35 energy · +1 health'));
      }
      fermaTempo(0.16); scossa = 1; tonfo(55, 0.6); ringhio(o, 0.5, true);
    } else if (E.fase === 3 && E.t > 1.0) {
      mosse.esegui = null;
    }
  }

  /* LA SCHIVATA (C o 💨): uno scatto nella direzione in cui si va —
     all'indietro se si sta fermi — con un attimo d'invulnerabilita' */
  function schiva() {
    if (!S || schermo !== 'gioco' || S.finito || mosse.esegui || (CD.schiva || 0) > 0) return;
    var av = (tasti.su ? 1 : 0) - (tasti.giu ? 1 : 0), lat = (tasti.latSx ? 1 : 0) - (tasti.latDx ? 1 : 0);
    if (!av && !lat) av = -1;
    var l = Math.hypot(av, lat); av /= l; lat /= l;
    var vx = -Math.sin(S.ang) * av - Math.cos(S.ang) * lat, vz = -Math.cos(S.ang) * av + Math.sin(S.ang) * lat;
    S.scatto = { x: vx, z: vz, k: 0.27, n: 14 };
    S.immune = Math.max(S.immune, 22);
    CD.schiva = 0.7;
    mosse.rollio = lat * 0.09; mosse.chino = 1;
    fruscio(0.28, 300, 1800, 0.07);
  }

  /* IL POTERE CARICATO: tenendo premuto (G, tasto destro, ✦) la sfera
     nella mano cresce; lasciando parte il potere, piu' forte quanto piu'
     si e' caricato. Un tocco breve e' il potere normale */
  function inizioCarica() {
    if (!S || schermo !== 'gioco' || S.finito || mosse.caricando) return;
    if (!potereAttivo()) { usaPotere(); return; }
    mosse.caricando = true; mosse.carica = 0;
  }
  function fineCarica() {
    if (!mosse.caricando) return;
    mosse.caricando = false;
    var k = mosse.carica;
    mosse.carica = 0;
    usaPotere(k < 0.2 ? 1 : 1 + k * 1.5);
  }

  /* il passo delle mosse, col tempo vero (dtR) e con quello del gioco (dtG) */
  function passoMosse(dtR, dtG) {
    mosse.finestra = Math.max(0, mosse.finestra - dtR);
    CD.schiva = Math.max(0, (CD.schiva || 0) - dtG);
    if (S.stordito > 0) S.stordito -= dtG;
    mosse.fov += ((S.scatto ? 1 : 0) - mosse.fov) * Math.min(1, dtR * (S.scatto ? 18 : 6));
    mosse.rollio *= Math.max(0, 1 - dtR * 7);
    mosse.chino *= Math.max(0, 1 - dtR * 6);
    if (!mosse.esegui) mosse.affondo *= Math.max(0, 1 - dtR * 9);
    if (mosse.caricando) {
      mosse.carica = Math.min(1, mosse.carica + dtR / 1.1);
      scossa = Math.max(scossa, mosse.carica * 0.08);
      if (mosse.carica >= 1 && !mosse.pieno) { mosse.pieno = true; bip(1320, 0.08, 'sine', 0.04); }
      /* gli archi che scappano dalla mano mentre si carica, sempre piu'
         spessi e lunghi, del colore dell'elemento */
      mosse.tArchi = (mosse.tArchi || 0) - dtR;
      if (!ps1() && camera && mosse.carica > 0.15 && mosse.tArchi <= 0) {
        mosse.tArchi = 0.09 - mosse.carica * 0.05;
        var palmo = new T.Vector3(-0.24, -0.2, -0.6).applyMatrix4(camera.matrixWorld);
        var fine = palmo.clone().add(new T.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(0.2 + mosse.carica * 0.45));
        var simC = potereAttivo(), colC = (simC && POTERI[simC] && POTERI[simC].colore) || 0x9fe8ff;
        arco(palmo, fine, colC, 0.1, 0.012 + mosse.carica * 0.02, mosse.carica > 0.6 ? 1 : 0);
      }
    } else mosse.pieno = false;
    passoEsecuzione(dtR);
    passoPericoli(dtG);
    /* il sangue sullo schermo: pulsa quando la salute e' poca */
    var poca = S.vitaMax ? 1 - S.vite / S.vitaMax : 0;
    mosse.sangue += ((S.vite <= 1 ? 1 : poca > 0.5 ? 0.5 : 0) - mosse.sangue) * Math.min(1, dtR * 3);
    if (post) {
      var U = post.mat.uniforms;
      U.scatto.value = mosse.fov;
      U.sangue.value = mosse.sangue;
      U.colpito.value = Math.max(0, (U.colpito.value || 0) - dtR * 2.2);
      U.urlo.value = Math.max(0, (S.stordito || 0) / 1.6);
      U.lento.value += ((tempoG.lento > 0 ? 1 : 0) - U.lento.value) * Math.min(1, dtR * 8);
    }
  }

  /* LE REAZIONI: due cose che il giocatore fa (o trova) si combinano —
     gelo e colpo pesante, fuoco e nube tossica, scarica e ghiaccio o acido.
     Rendono punti ed energia, e la prima volta si spiega che cosa e'
     successo */
  var REAZIONI = {
    frantuma: [['Frantumazione', 'Shatter'], ['il ghiaccio fragile si spezza sotto il colpo', 'brittle ice breaks under the blow']],
    combustione: [['Combustione', 'Combustion'], ['il gas della nube brucia tutto in un colpo', 'the cloud gas burns all at once']],
    conduzione: [['Conduzione', 'Conduction'], ['l\u2019acqua e l\u2019acido conducono la scarica', 'water and acid conduct the discharge']]
  };
  function reazione(k, p, col) {
    var R = REAZIONI[k], en = lingua() === 'en' ? 1 : 0;
    S.reazioni = S.reazioni || {};
    var prima = !S.reazioni[k];
    S.reazioni[k] = (S.reazioni[k] || 0) + 1;
    S.punti += 75; S.energia = Math.min(100, (S.energia || 0) + 15);
    numero(p.clone().setY(p.y + 0.6), '⚗ ' + R[0][en].toUpperCase(), '#' + new T.Color(col).getHexString());
    luceLampo(p, col, 4, 0.35); fermaTempo(0.08); scossa = Math.max(scossa, 0.5);
    bip(660, 0.12, 'triangle', 0.05); setTimeout(function () { bip(990, 0.18, 'triangle', 0.05); }, 90);
    if (prima) avviso('⚗ ' + t('Reazione: ', 'Reaction: ') + R[0][en], R[1][en] + ' · +75');
  }
  function conduce(n) {
    if (n.o._gelo > 0) return true;
    return pericoli.some(function (P) { return P.tipo === 'pozza' && P.t >= P.ritardo && Math.hypot(n.p.x - P.x, n.p.z - P.z) < P.r; });
  }

  /* LE GOCCE: quello che esce da un colpo, del colore della creatura,
     scuro, che cade a terra */
  function sangue(p, col, n, dir) {
    if (!ps1() && IMP.sangue !== 'ridotto') {
      /* IL SANGUE VERO: gocce stirate che partono nella direzione del
         colpo e cadono macchiando, una nebbiolina rossa che resta un
         attimo nell'aria, e il getto dalla parte opposta */
      for (var g = 0; g < n * 1.6; g++) {
        var vg = new T.Vector3((Math.random() - 0.5) * 3.5, Math.random() * 3 + 0.5, (Math.random() - 0.5) * 3.5);
        if (dir) vg.addScaledVector(dir, 2.5 + Math.random() * 3);
        gocciaSangue(p.clone().add(new T.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)), vg, 0.035 + Math.random() * 0.05);
      }
      for (var m2 = 0; m2 < 2 + n / 8; m2++) fumo(p.clone(), new T.Vector3((Math.random() - 0.5) * 0.8, 0.2, (Math.random() - 0.5) * 0.8).addScaledVector(dir || new T.Vector3(), 0.6),
                                                 0x5a0606, 0.5 + Math.random() * 0.4, 0.35 + Math.random() * 0.3, 0.45);
      return;
    }
    var c = new T.Color(col).lerp(new T.Color(0x220000), 0.45).getHex();
    for (var i = 0; i < n; i++) {
      var v = new T.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3);
      if (dir) v.addScaledVector(dir, 2.5);
      particella(p, v, i % 4 ? c : col, 0.45 + Math.random() * 0.4, 0.06 + Math.random() * 0.09, 9);
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     I PERICOLI A TERRA: gli attacchi speciali dei mostri si annunciano con
     un cerchio sul pavimento. «area»: il disco si riempie, poi colpisce chi
     e' dentro. «onda»: un anello che si allarga dal punto d'impatto — si
     salta. «pozza»: resta e brucia chi ci cammina
     ═════════════════════════════════════════════════════════════════════════ */
  var pericoli = [], geoAnello = null, geoDisco = null, geoMuro = null;
  function pericolo(opz) {
    if (!scena) return null;
    if (!geoAnello) { geoAnello = new T.RingGeometry(0.8, 1, 64); geoDisco = new T.CircleGeometry(1, 40); }
    var mA = new T.MeshBasicMaterial({ color: opz.col, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide });
    /* il disco e' una macchia scura del colore dell'attacco (si legge sul
       marmo bianco come su quello verde), l'anello e' luce */
    var mD = new T.MeshBasicMaterial({ color: new T.Color(opz.col).multiplyScalar(0.3), transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false, side: T.DoubleSide });
    var an = new T.Mesh(geoAnello, mA), di = new T.Mesh(geoDisco, mD);
    [di, an].forEach(function (m, k) { m.rotation.x = -Math.PI / 2; m.position.set(opz.x, 0.03 + k * 0.005, opz.z); m.renderOrder = 3 + k; scena.add(m); });
    /* l'onda ha anche un muro di luce basso, che corre sul pavimento */
    var muro = null;
    if (opz.tipo === 'onda') {
      if (!geoMuro) { geoMuro = new T.CylinderGeometry(1, 1, 0.5, 64, 1, true); geoMuro.translate(0, 0.25, 0); }
      muro = new T.Mesh(geoMuro, new T.ShaderMaterial({
        uniforms: { colore: { value: new T.Color(opz.col) }, forza: { value: 1 } },
        vertexShader: 'varying float vY; void main(){ vY = position.y / 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 colore; uniform float forza; varying float vY; void main(){ gl_FragColor = vec4(colore * forza * (1.0 - vY) * (1.0 - vY), 1.0); }',
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false }));
      muro.position.set(opz.x, 0.02, opz.z); muro.renderOrder = 5; scena.add(muro);
    }
    var P = { x: opz.x, z: opz.z, r: opz.r || 1.4, tipo: opz.tipo || 'area', ritardo: opz.ritardo || 0.8, durata: opz.durata || 0, vel: opz.vel || 7,
              col: opz.col, nome: opz.nome, fonte: opz.fonte || { x: opz.x, z: opz.z }, t: 0, an: an, di: di, muro: muro, fatto: false, poi: opz.poi };
    pericoli.push(P);
    return P;
  }
  function vaVia(P) {
    [P.an, P.di, P.muro].forEach(function (m) { if (m) { scena.remove(m); m.material.dispose(); } });
  }
  function colpisci(P) {
    if (S.immune > 0 || S.scudo > 0 || S.finito) return;
    danno((P.nome ? P.nome[lingua() === 'en' ? 1 : 0] : '') + t(' ti ha colpito', ' hit you'), P.fonte);
  }
  function passoPericoli(dt) {
    for (var i = pericoli.length - 1; i >= 0; i--) {
      var P = pericoli[i];
      P.t += dt;
      var d = Math.hypot(S.pos.x - P.x, S.pos.z - P.z), fine = false;
      if (P.tipo === 'area') {
        var k = Math.min(1, P.t / P.ritardo);
        P.an.scale.setScalar(P.r); P.di.scale.setScalar(Math.max(0.01, P.r * k));
        P.an.material.opacity = 0.75 + Math.sin(P.t * 30) * 0.25;
        /* dentro il cerchio che si riempie: i bordi dello schermo pulsano e
           un ticchettio accelera — e' sotto i piedi, non sempre si vede */
        if (!P.fatto && d < P.r) {
          if (post) post.mat.uniforms.colpito.value = Math.max(post.mat.uniforms.colpito.value, 0.25 + 0.25 * Math.sin(P.t * 25));
          P.tic = (P.tic || 0) - dt;
          if (P.tic <= 0) { P.tic = 0.3 * (1 - k) + 0.06; bip(1500 + k * 900, 0.04, 'square', 0.03); }
        }
        if (k >= 1 && !P.fatto) {
          P.fatto = true;
          if (d < P.r) colpisci(P);
          esplosione(new T.Vector3(P.x, 0.3, P.z), P.col, 0.8, false);
          if (P.poi) P.poi(P);
        }
        if (P.fatto) { P.di.material.opacity *= 0.85; P.an.material.opacity *= 0.85; fine = P.t > P.ritardo + 0.4; }
      } else if (P.tipo === 'onda') {
        var rr = P.t * P.vel;
        P.an.scale.setScalar(Math.max(0.05, rr)); P.di.visible = false;
        P.an.material.opacity = Math.max(0, 1.4 * (1 - rr / P.r));
        if (P.muro) { P.muro.scale.set(Math.max(0.05, rr), 1 - rr / P.r * 0.6, Math.max(0.05, rr)); P.muro.material.uniforms.forza.value = Math.max(0, 1 - rr / P.r); }
        /* l'onda corre sul pavimento: chi e' in aria passa sopra */
        if (!P.fatto && Math.abs(d - rr) < 0.5 && S.pos.y - (S.lab ? S.labSuolo : 0) < 0.3) { P.fatto = true; colpisci(P); }
        if (Math.random() < 0.5) particella(new T.Vector3(P.x + Math.cos(P.t * 40) * rr, 0.15, P.z + Math.sin(P.t * 40) * rr), new T.Vector3(0, 1.5, 0), P.col, 0.3, 0.2, 2);
        fine = rr > P.r;
      } else {
        var k2 = Math.min(1, P.t / P.ritardo);
        P.an.scale.setScalar(P.r); P.di.scale.setScalar(P.r * (k2 < 1 ? k2 : 1));
        P.di.material.opacity = k2 < 1 ? 0.2 : 0.45 + Math.sin(P.t * 5) * 0.1;
        if (k2 >= 1 && d < P.r * 0.9) colpisci(P);
        if (k2 >= 1 && Math.random() < 0.25) particella(new T.Vector3(P.x + (Math.random() - 0.5) * P.r * 1.4, 0.1, P.z + (Math.random() - 0.5) * P.r * 1.4), new T.Vector3(0, 0.8, 0), P.col, 0.7, 0.14, -0.5);
        fine = P.t > P.ritardo + P.durata;
        if (P.t > P.ritardo + P.durata - 0.6) { P.di.material.opacity *= 0.9; P.an.material.opacity *= 0.9; }
      }
      if (fine) { vaVia(P); pericoli.splice(i, 1); }
    }
  }
  function pulisciPericoli() { pericoli.forEach(vaVia); pericoli = []; mosse.esegui = null; if (S) { S.scatto = null; S.orda = null; } }
  /* caduti durante un'orda: l'orda ricomincia da capo la prossima volta,
     e chi ne era rimasto sparisce */
  function azzeraOrda() {
    var st = S && S.orda;
    if (!st) return;
    (st.oggetti || []).forEach(function (o) { if (o._orda && o.vivo) { o.vivo = false; o.abbattuto = true; if (o._nodo) o._nodo.visible = false; } });
    st._orda.ondata = 0; st._orda.pausa = 0;
    S.orda = null;
  }

  /* GLI ATTACCHI SPECIALI DEI MOSTRI. Ognuno ha il suo, oltre a quello
     normale, e lo usa ogni tanto: si vede arrivare (il corpo si carica, il
     cerchio a terra) e si schiva — di lato, saltando, con la schivata */
  var SPECIALI = {
    bruto: { nome: 'tonfo', carica: 1.0, cd: 8, da: 0, a: 7 },        /* pugni a terra: l'onda d'urto, da saltare */
    mostro: { nome: 'schegge', carica: 0.8, cd: 7, da: 2, a: 11 },    /* esplode in schegge di cristallo */
    palude: { nome: 'pozza', carica: 0.7, cd: 7, da: 2.5, a: 11 },    /* sputa fango acido che resta a terra */
    cervo: { nome: 'urlo', carica: 0.7, cd: 9, da: 2.5, a: 10 },      /* urla (ti rallenta) e si lancia */
    abissale: { nome: 'svanisce', carica: 0.5, cd: 8, da: 3, a: 12 }, /* sparisce e ricompare di fianco */
    verme: { nome: 'sotterra', carica: 0.5, cd: 8, da: 3, a: 10 },    /* si infila nel pavimento e sbuca sotto di te */
    curvo: { nome: 'balzo', carica: 0.6, cd: 7, da: 3, a: 10 }        /* un balzo altissimo, ricade dove eri */
  };
  function passoSpeciale(o, sx, SM, V, colV, d, ux, uz, wx, wz, dt) {
    var SP = o._sp, nm = SM.nome, fonte = { x: wx, z: wz };
    SP.t += dt;
    var mx = 0, mz = 0;
    if (SP.fase === 'carica') {
      if (SP.t >= SPECIALI[o.specie].carica) { SP.fase = 'via'; SP.t = 0; SP.inizio = true; }
      return { mx: 0, mz: 0 };
    }
    var inizio = SP.inizio; SP.inizio = false;
    var tipo = SPECIALI[o.specie].nome, finito = false;
    if (tipo === 'tonfo') {
      if (inizio) {
        pericolo({ x: wx, z: wz, r: 8 * V.scala, tipo: 'onda', vel: 7.5, col: colV, nome: nm, fonte: fonte });
        esplosione(new T.Vector3(wx, 0.2, wz), colV, 1.1, false);
        scossa = Math.max(scossa, Math.max(0.2, 1 - d / 10)); tonfo(45, 0.7);
      }
      finito = SP.t > 0.6;
    } else if (tipo === 'schegge') {
      if (inizio) {
        var pn = posNemico(o), n = 12 + V.extra * 4;
        for (var i = 0; i < n; i++) {
          var a = i / n * Math.PI * 2, pr = proiettile(pn.clone(), new T.Vector3(Math.sin(a), 0.05, Math.cos(a)).multiplyScalar(7.5), colV, false);
          pr.fonte = fonte; pr.nome = nm; proiettili.push(pr);
        }
        esplosione(pn, colV, 0.9, false); bip(1800, 0.2, 'triangle', 0.05);
      }
      finito = SP.t > 0.5;
    } else if (tipo === 'pozza') {
      if (inizio) {
        for (var j = 0; j < 3; j++) {
          var px = S.pos.x + (j ? (Math.random() - 0.5) * 3 : S.vel.x * 30), pz = S.pos.z + (j ? (Math.random() - 0.5) * 3 : S.vel.z * 30);
          pericolo({ x: px, z: pz, r: 1.25, tipo: 'pozza', ritardo: 0.85, durata: 4.5, col: colV, nome: nm, fonte: fonte });
          var p0 = posNemico(o), vv = new T.Vector3(px - p0.x, 0, pz - p0.z).divideScalar(0.85);
          vv.y = 0.5 * 4.5 * 0.85 + (0.1 - p0.y) / 0.85;
          var gl = proiettile(p0, vv, colV, false); gl.g = 4.5; gl.innocuo = true; proiettili.push(gl);
        }
        bip(150, 0.3, 'sawtooth', 0.05);
      }
      finito = SP.t > 0.6;
    } else if (tipo === 'urlo') {
      if (inizio) {
        if (d < 10) { S.stordito = 1.6; scossa = Math.max(scossa, 0.6); }
        ringhio(o, 1.2, true);
        for (var r2 = 0; r2 < 3; r2++) pericolo({ x: wx, z: wz, r: 6 + r2 * 2, tipo: 'onda', vel: 9 - r2, col: colV, nome: nm, fonte: fonte }).fatto = true;
        SP.dir = { x: ux, z: uz };
      }
      /* poi la carica a testa bassa */
      if (SP.t > 0.5) {
        mx = SP.dir.x * 7.5 * dt; mz = SP.dir.z * 7.5 * dt;
        if (!SP.colpito && d < SM.portata + 0.3 && !S.immune && !(S.scudo > 0)) { SP.colpito = true; danno(nm[lingua() === 'en' ? 1 : 0] + t(' ti ha travolto', ' ran you over'), fonte); }
      }
      finito = SP.t > 1.15;
    } else if (tipo === 'svanisce') {
      if (inizio) { esplosione(posNemico(o), colV, 0.7, false); o._nodo.visible = false; o._nascosto = true; }
      if (SP.t > 0.45 && o._nascosto) {
        /* ricompare di fianco, a tre metri e mezzo, dentro la stanza */
        var lato = Math.random() < 0.5 ? 1 : -1, ang = Math.atan2(-ux, -uz) + lato * 1.3;
        var nx = S.pos.x + Math.sin(ang) * 3.5 - sx.x, nz = S.pos.z + Math.cos(ang) * 3.5 - sx.z;
        nx = Math.max(-sx.larg / 2 + 0.7, Math.min(sx.larg / 2 - 0.7, nx)); nz = Math.max(-sx.prof / 2 + 0.7, Math.min(sx.prof / 2 - 0.7, nz));
        o.x = nx; o.z = nz; o._ip.x0 = nx; o._ip.z0 = nz;
        o._nascosto = false; o._nodo.visible = true;
        esplosione(posNemico(o), colV, 0.7, false);
        o._fase = 'carica'; o._tf = 0.3; o._sp = null;
        return { mx: 0, mz: 0 };
      }
    } else if (tipo === 'sotterra') {
      if (inizio) { SP.quota = 0; scintille(posNemico(o), colV, 14); tonfo(90, 0.3); }
      if (!SP.sotto) {
        SP.quota = Math.max(-2.6, SP.quota - dt * 6);
        if (SP.quota <= -2.6) {
          SP.sotto = true; SP.tSotto = SP.t;
          var bx = S.pos.x, bz = S.pos.z;
          pericolo({ x: bx, z: bz, r: 1.5, tipo: 'area', ritardo: 0.9, col: colV, nome: nm, fonte: { x: bx, z: bz } });
          o.x = Math.max(-sx.larg / 2 + 0.7, Math.min(sx.larg / 2 - 0.7, bx - sx.x)); o.z = Math.max(-sx.prof / 2 + 0.7, Math.min(sx.prof / 2 - 0.7, bz - sx.z));
          o._ip.x0 = o.x; o._ip.z0 = o.z;
        }
      } else if (SP.t - SP.tSotto > 0.9) {
        SP.quota = Math.min(0, SP.quota + dt * 9);
        if (SP.quota === 0) finito = true;
      }
      o._quotaSalto = SP.quota;
    } else if (tipo === 'balzo') {
      if (inizio) {
        SP.da = { x: o.x, z: o.z };
        SP.a = { x: Math.max(-sx.larg / 2 + 0.7, Math.min(sx.larg / 2 - 0.7, S.pos.x - sx.x)), z: Math.max(-sx.prof / 2 + 0.7, Math.min(sx.prof / 2 - 0.7, S.pos.z - sx.z)) };
        pericolo({ x: sx.x + SP.a.x, z: sx.z + SP.a.z, r: 1.7, tipo: 'area', ritardo: 1.0, col: colV, nome: nm, fonte: fonte,
                   poi: function () { scossa = Math.max(scossa, 0.5); tonfo(60, 0.4); } });
        ringhio(o, 0.6, false);
      }
      var kk = Math.min(1, SP.t / 1.0);
      mx = SP.da.x + (SP.a.x - SP.da.x) * kk - o.x; mz = SP.da.z + (SP.a.z - SP.da.z) * kk - o.z;
      o._quotaSalto = Math.sin(kk * Math.PI) * 3.4;
      finito = kk >= 1;
    }
    if (finito) { o._sp = null; o._fase = 'insegui'; o._quotaSalto = 0; o._cd = Math.max(o._cd || 0, 0.8); }
    return { mx: mx, mz: mz };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL SUONO DEL POSTO: rumore filtrato e oscillatori, niente file. Il
     ronzio basso dell'istituto, i colpi lontani nei tubi, i passi, i
     fruscii delle mosse, i tonfi dei colpi, i versi delle creature
     ═════════════════════════════════════════════════════════════════════════ */
  var bufRumore = null, amb = null;
  function contesto() {
    if (IMP.suono !== 'acceso') return null;
    try { if (!audio) audio = new (globale.AudioContext || globale.webkitAudioContext)(); } catch (e) { return null; }
    if (!bufRumore) {
      bufRumore = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      var d = bufRumore.getChannelData(0), ultimo2 = 0;
      for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; ultimo2 = (ultimo2 + 0.02 * w) / 1.02; d[i] = ultimo2 * 3.5 * 0.5 + w * 0.5; }
    }
    return audio;
  }
  function rumore(durata, f0, f1, vol, tipoF, q) {
    var A = contesto(); if (!A) return;
    try {
      var s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(), t0 = A.currentTime;
      s.buffer = bufRumore; s.loop = true;
      f.type = tipoF || 'bandpass'; f.Q.value = q || 1.2;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + durata);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, durata * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + durata);
      s.connect(f); f.connect(g); g.connect(A.destination);
      s.start(t0, Math.random() * 1.5); s.stop(t0 + durata + 0.05);
    } catch (e) {}
  }
  function fruscio(durata, f0, f1, vol) { rumore(durata, f0, f1, vol, 'bandpass', 0.9); }
  function tonfo(freq, durata) {
    var A = contesto(); if (!A) return;
    try {
      var o = A.createOscillator(), g = A.createGain(), t0 = A.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(freq * 2.2, t0); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t0 + durata);
      g.gain.setValueAtTime(0.16, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + durata);
      o.connect(g); g.connect(A.destination); o.start(t0); o.stop(t0 + durata + 0.02);
    } catch (e) {}
    rumore(durata * 0.6, 1800, 200, 0.08, 'lowpass', 0.7);
  }
  /* il verso: una sega bassa che trema, passata in un filtro che si apre e
     si chiude come una gola; ogni specie ha la sua altezza */
  var VOCI = { bruto: 48, mostro: 95, palude: 62, cervo: 140, abissale: 210, verme: 80, curvo: 110 };
  function ringhio(o, durata, forte) {
    var A = contesto(); if (!A || !o) return;
    var dist = 1;
    try { var p = posNemico(o); dist = Math.hypot(p.x - S.pos.x, p.z - S.pos.z); } catch (e) {}
    var vol = (forte ? 0.11 : 0.06) / (1 + dist * 0.25);
    if (vol < 0.006) return;
    try {
      var f0 = (VOCI[o.specie] || 90) * (0.9 + Math.random() * 0.2), t0 = A.currentTime;
      var os = A.createOscillator(), lfo = A.createOscillator(), lg = A.createGain(), fl = A.createBiquadFilter(), g = A.createGain();
      os.type = 'sawtooth'; os.frequency.setValueAtTime(f0, t0); os.frequency.linearRampToValueAtTime(f0 * (forte ? 0.7 : 0.85), t0 + durata);
      lfo.frequency.value = 18 + Math.random() * 12; lg.gain.value = f0 * 0.12; lfo.connect(lg); lg.connect(os.frequency);
      fl.type = 'bandpass'; fl.Q.value = 3; fl.frequency.setValueAtTime(f0 * 4, t0); fl.frequency.linearRampToValueAtTime(f0 * (forte ? 9 : 6), t0 + durata * 0.4); fl.frequency.linearRampToValueAtTime(f0 * 3, t0 + durata);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + durata);
      os.connect(fl); fl.connect(g); g.connect(A.destination);
      os.start(t0); lfo.start(t0); os.stop(t0 + durata + 0.05); lfo.stop(t0 + durata + 0.05);
    } catch (e) {}
    rumore(durata, 600, 300, vol * 0.5, 'bandpass', 2);
  }
  /* il fondo: due note basse appena stonate fra loro e un soffio d'aria
     nei condotti; la tensione sale quando qualcosa ti ha visto */
  function suonoAmbiente(dtR, attivo) {
    var A = attivo ? contesto() : audio;
    if (!A) return;
    try {
      if (!amb && attivo) {
        var g = A.createGain(); g.gain.value = 0; g.connect(A.destination);
        var o1 = A.createOscillator(), o2 = A.createOscillator(), fo = A.createBiquadFilter();
        o1.type = o2.type = 'sawtooth'; o1.frequency.value = 41; o2.frequency.value = 41.7;
        fo.type = 'lowpass'; fo.frequency.value = 120; fo.Q.value = 0.7;
        o1.connect(fo); o2.connect(fo); fo.connect(g);
        var s = A.createBufferSource(), fa = A.createBiquadFilter(), ga = A.createGain();
        s.buffer = bufRumore; s.loop = true; fa.type = 'bandpass'; fa.frequency.value = 380; fa.Q.value = 0.6; ga.gain.value = 0.5;
        s.connect(fa); fa.connect(ga); ga.connect(g);
        o1.start(); o2.start(); s.start();
        amb = { g: g, fo: fo, fa: fa, tensione: 0, prossimo: 4, passo: 0 };
      }
      if (!amb) return;
      var vuole = attivo ? 0.05 + amb.tensione * 0.05 : 0;
      amb.g.gain.value += (vuole - amb.g.gain.value) * Math.min(1, dtR * 2);
      if (!attivo) return;
      amb.fo.frequency.value = 120 + amb.tensione * 140;
      amb.fa.frequency.value = 380 + Math.sin(A.currentTime * 0.13) * 160;
      /* i colpi lontani nei tubi, ogni tanto */
      amb.prossimo -= dtR;
      if (amb.prossimo <= 0) { amb.prossimo = 6 + Math.random() * 12; rumore(1.4, 220 + Math.random() * 300, 80, 0.03, 'bandpass', 8); }
      /* i passi */
      var v = Math.hypot(S.vel.x, S.vel.z), fase = Math.floor((S.passi || 0) * (v > 0.07 ? 3.9 : 4.5) / Math.PI);
      if (v > 0.01 && S.terra && fase !== amb.passo) rumore(0.09, v > 0.07 ? 900 : 650, 180, v > 0.07 ? 0.05 : 0.03, 'lowpass', 1);
      amb.passo = fase;
    } catch (e) {}
  }

  /* usare quello che si ha in mano: la scorciatoia del combattimento */
  function usaRapido() {
    if (!S) return;
    if (S.boss && S.boss.attivo && /^enigma:/.test(faseCorrente(S.boss).serve)) { spruzzo(); sfidaBoss(); return; }
    sparo();
  }


  /* ═════════════════════════════════════════════════════════════════════════
     IL CICLO E L'AVVIO
     ═════════════════════════════════════════════════════════════════════════ */
  function visibile() {
    var s = document.getElementById(ID);
    return !!(s && getComputedStyle(s).display !== 'none');
  }

  var dimPrec = '';
  /* IL PROFILO: quanto costa ogni parte del fotogramma (media mobile, ms).
     Serve a sapere dove va il tempo, non a indovinarlo */
  var prof = { passo: 0, scena: 0, disegna: 0, hud: 0, fotogramma: 16.7, scala: 1, giri: 0 };
  function misura(k, t0) { prof[k] += ((performance.now() - t0) - prof[k]) * 0.1; }
  /* LA RISOLUZIONE DINAMICA: se il fotogramma costa troppo si disegna a
     una risoluzione un po' piu' bassa (fino al 55%), e quando c'e' margine
     si risale: il movimento resta fluido, che e' quello che si sente */
  var risDin = { lento: 0, veloce: 0, base: 1 };
  function adattaRisoluzione(dtMs) {
    if (!ren || ps1() || IMP.risdin === 'no') return;
    prof.fotogramma += (dtMs - prof.fotogramma) * 0.05;
    if (prof.fotogramma > 21) { risDin.lento += dtMs; risDin.veloce = 0; }
    else if (prof.fotogramma < 14.5) { risDin.veloce += dtMs; risDin.lento = 0; }
    else { risDin.lento = risDin.veloce = 0; }
    var nuova = prof.scala;
    if (risDin.lento > 900 && prof.scala > 0.56) { nuova = Math.max(0.55, prof.scala - 0.1); risDin.lento = 0; }
    if (risDin.veloce > 3000 && prof.scala < 1) { nuova = Math.min(1, prof.scala + 0.1); risDin.veloce = 0; }
    if (nuova !== prof.scala) {
      prof.scala = nuova;
      ren.setPixelRatio(risDin.base * nuova);
      dimPrec = '';
    }
  }
  /* i nemici si disegnano fra la posizione del passo prima e quella
     dell'ultimo, come il giocatore */
  var frustum = null, mFrustum = null, sferaN = null;
  function interpolaNemici(alfa) {
    var st = mondo.stanzaCorrente;
    if (!st || S.lab) return;
    /* i nemici fuori dall'inquadratura non si disegnano (le loro mesh non
       hanno il ritaglio automatico: l'animazione ne sposta i vertici) */
    if (!frustum) { frustum = new T.Frustum(); mFrustum = new T.Matrix4(); sferaN = new T.Sphere(); }
    camera.updateMatrixWorld(); mFrustum.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(mFrustum);
    var stanze = [st];
    (st.porte || []).forEach(function (p) { var s2 = mondo.zona.stanze.filter(function (x) { return x.id === p.a; })[0]; if (s2) stanze.push(s2); });
    stanze.forEach(function (s3) {
      (s3.oggetti || []).forEach(function (o) {
        if (o.tipo !== 'nemico' || !o._nodo || !o._ip) return;
        var a = o._ip;
        o._nodo.position.set(a.x0 + (o.x - a.x0) * alfa, a.y0 + (a.y1 - a.y0) * alfa, a.z0 + (o.z - a.z0) * alfa);
        var dr = Math.atan2(Math.sin(a.r1 - a.r0), Math.cos(a.r1 - a.r0));
        o._nodo.rotation.y = a.r0 + dr * alfa;
        if (!o.vivo && !(o._muore > 0)) return;
        var sp = specieDi(o), h = (sp.m ? sp.m.alto : 1.6) * (o._var ? o._var.scala : 1);
        sferaN.center.set(s3.x + o._nodo.position.x, h * 0.5, s3.z + o._nodo.position.z); sferaN.radius = h * 0.75 + 0.5;
        o._nodo.visible = !o._nascosto && frustum.intersectsSphere(sferaN);
      });
    });
  }
  function ciclo(ora) {
    anim = null;
    if (!visibile() || !pronto) { ultimo = 0; return; }
    if (!ultimo) ultimo = ora;
    var dt = Math.min(ora - ultimo, 200);
    ultimo = ora;
    adattaRisoluzione(dt);
    /* il tempo del gioco: si ferma un attimo sui colpi pesanti, rallenta
       nelle esecuzioni (lo schermo intanto resta fluido) */
    var kT = scalaTempo(dt / 1000), dtR = dt;
    dt *= kT;
    accumulo += dt;
    var giri = 0, t0 = performance.now();
    while (accumulo >= PASSO && giri < 5) { passo(); accumulo -= PASSO; giri++; }
    if (accumulo > PASSO * 5) accumulo = 0;
    misura('passo', t0); prof.giri = giri;
    /* i proiettili, le nubi, gli effetti: col tempo vero del fotogramma */
    if (S && mondo && schermo === 'gioco') { passoCombattimento(Math.min(0.05, dt / 1000)); passoMosse(Math.min(0.05, dtR / 1000), Math.min(0.05, dt / 1000)); }
    t0 = performance.now();
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
      /* L'INTERPOLAZIONE: il gioco avanza a passi fissi di 1/60 s, lo
         schermo va alla sua frequenza (90, 120, 144 Hz): si disegna fra
         l'ultima posizione e quella prima, cosi' niente scatti */
      var reale = null, alfa = Math.max(0, Math.min(1, accumulo / PASSO));
      if (S.posPrec && !ps1()) {
        reale = { x: S.pos.x, y: S.pos.y, z: S.pos.z };
        S.pos.x = S.posPrec.x + (reale.x - S.posPrec.x) * alfa;
        S.pos.y = S.posPrec.y + (reale.y - S.posPrec.y) * alfa;
        S.pos.z = S.posPrec.z + (reale.z - S.posPrec.z) * alfa;
      }
      aggiornaZoom(dtR / 1000);
      animaChimico();
      muoviCamera();
      if (reale) { S.pos.x = reale.x; S.pos.y = reale.y; S.pos.z = reale.z; }
      if (!ps1()) interpolaNemici(alfa);
      animaMorti(dt / 1000);
      aggiornaNumeri(dt / 1000);
    }
    misura('scena', t0);
    if (!ps1()) adattaDimensioni();
    if (ren) { ren.info.autoReset = false; ren.info.reset(); }
    t0 = performance.now(); disegna(ora); misura('disegna', t0);
    if (ren) { prof.chiamate = ren.info.render.calls; prof.triangoli = ren.info.render.triangles; }
    t0 = performance.now(); hud(); misura('hud', t0);
    suonoAmbiente(dtR / 1000, !!(S && mondo && schermo === 'gioco'));
    anim = requestAnimationFrame(ciclo);
  }

  /* un fotogramma: il mondo, le braccia sopra, la passata finale */
  function disegna(ora) {
    if (ren && scena && camera) {
      if (post) { adattaPost(); ren.setRenderTarget(post.rt); }
      if (vista && IMP.visuale === 'prima' && S && mondo && schermo === 'gioco') {
        ren.autoClear = false;
        ren.clear();
        ren.render(scena, camera);
        ren.clearDepth();
        ren.render(scenaMani, camMani);
        ren.autoClear = true;
      } else ren.render(scena, camera);
      if (post) {
        ren.setRenderTarget(null);
        post.mat.uniforms.tempo.value = (ora % 100000) / 1000;
        aggiornaRaggi();
        ren.render(post.scena, post.cam);
      }
    }
  }

  /* LA PASSATA FINALE «PS2 SERIA». I giochi della PS2 che si ricordano
     come seri — Silent Hill 2, Resident Evil 4, Metal Gear Solid 3 — non
     avevano piu' poligoni degli altri: avevano l'immagine trattata. Qui la
     scena (mondo e braccia) si disegna in una texture e poi passa da uno
     shader: colore da pellicola (un po' meno saturo, ombre fredde, luci
     calde, piu' contrasto), i bagliori morbidi delle luci forti (solo in
     alta), la vignettatura e la grana, che si muove. Lavora sui valori gia'
     mappati (ACES e sRGB li fa il motore entrando nella texture). In PS1 no:
     quello stile ha la sua passata */
  var post = null;
  var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var POST_FS = [
    'uniform sampler2D tDiffuse; uniform vec2 risol; uniform float tempo; uniform float bagliore;',
    'uniform float scatto; uniform float sangue; uniform float colpito; uniform float urlo; uniform float lento;',
    'uniform vec2 raggiPos; uniform float raggiForza;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'vec3 forte(vec2 uv){ vec3 c = texture2D(tDiffuse, uv).rgb; return max(c - 0.72, 0.0); }',
    'void main(){',
    /* l'aberrazione cromatica: appena sui bordi, forte nello scatto, nel
       colpo subito, nell'urlo; la sfocatura radiale nello scatto */
    '  vec2 dc = vUv - 0.5;',
    '  float ab = 0.0015 + dot(dc, dc) * 0.006 + scatto * 0.006 + colpito * 0.009 + urlo * 0.007 * (0.6 + 0.4 * sin(tempo * 40.0));',
    '  vec3 c = vec3(texture2D(tDiffuse, vUv + dc * ab * 2.0).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - dc * ab * 2.0).b);',
    '  if (scatto > 0.02) { vec3 sb = c; for (int i = 1; i < 6; i++) sb += texture2D(tDiffuse, vUv - dc * float(i) * 0.012 * scatto).rgb; c = mix(c, sb / 6.0, min(1.0, scatto * 1.2)); }',
    '  if (bagliore > 0.0) {',
    '    vec2 px = 1.0 / risol; vec3 b = vec3(0.0);',
    '    for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854;',
    '      vec2 d = vec2(cos(a), sin(a));',
    '      b += forte(vUv + d * px * 5.0) + forte(vUv + d * px * 12.0) * 0.7; }',
    '    c += b * (bagliore / 13.6);',
    '  }',
    /* i RAGGI DI LUCE: dalla lampada piu' vicina, i pixel forti si
       allungano verso chi guarda attraverso la nebbia (dodici campioni
       lungo la linea verso la lampada, sempre piu' deboli) */
    '  if (raggiForza > 0.0) {',
    '    vec2 dr = (vUv - raggiPos) / 14.0; vec2 ur = vUv; float dec = 1.0; vec3 rg = vec3(0.0);',
    '    for (int i = 0; i < 14; i++) { ur -= dr; rg += forte(ur) * dec; dec *= 0.9; }',
    '    c += rg * raggiForza * 0.16;',
    '  }',
    '  float l = dot(c, vec3(0.299, 0.587, 0.114));',
    '  c = c - pow(max(c - 0.7, 0.0), vec3(2.0)) * 0.9;',
    '  c = mix(vec3(l), c, 0.84);',
    '  c += vec3(-0.012, 0.004, 0.02) * (1.0 - l) + vec3(0.025, 0.012, -0.012) * l;',
    '  c = (c - 0.5) * 1.1 + 0.48;',
    '  vec2 q = vUv - 0.5; q.x *= risol.x / risol.y;',
    '  c *= 1.0 - 0.55 * pow(clamp(length(q) * 1.08, 0.0, 1.0), 2.2);',
    /* la salute poca: il rosso sui bordi che batte come il cuore, il colore
       che se ne va; il rallentatore toglie colore e scalda */
    '  float bordo = smoothstep(0.25, 0.85, length(q));',
    '  float cuore = 0.55 + 0.45 * pow(abs(sin(tempo * 3.4)), 6.0);',
    '  float lr = dot(c, vec3(0.299, 0.587, 0.114));',
    '  c = mix(c, vec3(lr), sangue * 0.45 + lento * 0.5);',
    '  c = mix(c, vec3(0.35, 0.0, 0.0), bordo * (sangue * 0.65 * cuore + colpito * 0.5));',
    '  c = mix(c, c * vec3(1.08, 0.95, 0.82), lento * 0.6);',
    '  float g = hash(floor(vUv * risol) + fract(tempo * 7.13) * 91.7) - 0.5;',
    '  c += g * 0.045 * (1.0 - l * 0.6);',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'].join('\n');
  function creaPost() {
    if (post) { post.rt.dispose(); post.mat.dispose(); post.geo.dispose(); post = null; }
    if (ps1() || !ren) return;
    var dim = ren.getDrawingBufferSize(new T.Vector2());
    var opz = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat };
    var rt = (ren.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget)
      ? new T.WebGLMultisampleRenderTarget(dim.x, dim.y, opz) : new T.WebGLRenderTarget(dim.x, dim.y, opz);
    if (rt.samples !== undefined) rt.samples = IMP.grafica === 'alta' ? 4 : 2;
    rt.texture.encoding = T.sRGBEncoding;
    var geo = new T.PlaneGeometry(2, 2);
    var mat = new T.ShaderMaterial({
      uniforms: { tDiffuse: { value: rt.texture }, risol: { value: dim.clone() }, tempo: { value: 0 },
                  bagliore: { value: IMP.grafica === 'alta' ? 1 : 0 }, scatto: { value: 0 }, sangue: { value: 0 },
                  colpito: { value: 0 }, urlo: { value: 0 }, lento: { value: 0 },
                  raggiPos: { value: new T.Vector2(0.5, 0.8) }, raggiForza: { value: 0 } },
      vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false, depthWrite: false
    });
    var sc = new T.Scene(), q = new T.Mesh(geo, mat);
    q.frustumCulled = false; sc.add(q);
    post = { rt: rt, mat: mat, geo: geo, scena: sc, cam: new T.Camera(), dim: dim };
  }
  var dimPost = null;
  function adattaPost() {
    if (!dimPost) dimPost = new T.Vector2();
    ren.getDrawingBufferSize(dimPost);
    if (dimPost.x !== post.dim.x || dimPost.y !== post.dim.y) {
      post.dim.copy(dimPost);
      post.rt.setSize(dimPost.x, dimPost.y);
      post.mat.uniforms.risol.value.copy(dimPost);
    }
  }

  /* dove sta, sullo schermo, la lampada piu' vicina accesa: i raggi
     partono da li', e si spengono quando esce dall'inquadratura */
  var vRaggi = null;
  function aggiornaRaggi() {
    var U = post.mat.uniforms, forza = 0;
    if (IMP.grafica === 'alta' && IMP.degrado !== 'no' && luci && luci.punti && luci.punti[0] && camera && S && !S.lab) {
      var p = luci.punti[0];
      if (p.intensity > 0.2) {
        if (!vRaggi) vRaggi = new T.Vector3();
        vRaggi.copy(p.position).project(camera);
        if (vRaggi.z < 1 && Math.abs(vRaggi.x) < 1.4 && Math.abs(vRaggi.y) < 1.4) {
          U.raggiPos.value.set((vRaggi.x + 1) / 2, (vRaggi.y + 1) / 2);
          forza = Math.max(0, 1 - Math.max(Math.abs(vRaggi.x), Math.abs(vRaggi.y)) / 1.4) * (p.intensity / Math.max(0.01, p.userData.base || 0.55));
        }
      }
    }
    U.raggiForza.value += (forza - U.raggiForza.value) * 0.2;
  }
  function avviaCiclo() { if (!anim && pronto) anim = requestAnimationFrame(ciclo); }
  function fermaCiclo() { if (anim) cancelAnimationFrame(anim); anim = null; ultimo = 0; mosse.caricando = false; if (amb) amb.g.gain.value = 0; }

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

  /* ═════════════════════════════════════════════════════════════════════════
     I LABORATORI — le mappe che l'utente ha scelto (models/mappe/), una per
     ala: Small Lab, Sci-fi lab, il laboratorio segreto di Flynn, il
     laboratorio sotterraneo, il laboratorio invaso dalla vegetazione.

     Ci si entra dalla porta nella stanza del banco. La mappa si scarica la
     prima volta, si monta lontano dal livello (che intanto si nasconde) e
     si percorre con la sua GRIGLIA DI CAMMINO (calcolata una volta da
     tools/prepara-mappe.js): celle da 25 cm, fino a tre pavimenti ognuna,
     percorribili o no — muri, arredi, scale e piani veri della mappa. Dentro
     c'e' il banco di sintesi, sul bancone vero della mappa, e il reattore e
     la capsula di contenimento (gli altri due modelli forniti) dove c'e'
     spazio. Si esce dalla porta da cui si e' entrati.
     ═════════════════════════════════════════════════════════════════════════ */
  var LAB_ORIGINE = { x: 0, z: 3000 };
  var NOMI_LAB = {
    small: ['Laboratorio piccolo', 'Small laboratory'],
    scifi1: ['Laboratorio Sci-fi', 'Sci-fi laboratory'],
    flynn: ['Il laboratorio segreto', 'The secret laboratory'],
    underground: ['Laboratorio sotterraneo', 'Underground laboratory'],
    overgrown: ['Laboratorio invaso dalle piante', 'Overgrown laboratory']
  };
  var cacheLab = {};
  var labMontato = null;     /* il gruppo del laboratorio in scena, di qualunque partita */
  function scaricaLab(nome) {
    if (!cacheLab[nome]) {
      cacheLab[nome] = libreriaGLTF().then(function (ok) {
        if (!ok) throw new Error('GLTFLoader assente');
        return Promise.all([
          fetch('models/mappe/' + nome + '.glb').then(function (r) { if (!r.ok) throw new Error(nome + '.glb HTTP ' + r.status); return r.arrayBuffer(); }),
          fetch('models/mappe/' + nome + '.json').then(function (r) { if (!r.ok) throw new Error(nome + '.json HTTP ' + r.status); return r.json(); })
        ]);
      }).catch(function (e) { cacheLab[nome] = null; throw e; });
    }
    return cacheLab[nome];
  }
  function scaricaApparecchio(nome) {
    var k = 'app:' + nome;
    if (!cacheLab[k]) cacheLab[k] = fetch('models/mappe/' + nome + '.glb').then(function (r) {
      if (!r.ok) throw new Error(nome + ' HTTP ' + r.status); return r.arrayBuffer(); }).catch(function () { cacheLab[k] = null; return null; });
    return cacheLab[k];
  }
  function daBase64(b) {
    var s2 = atob(b), u = new Uint8Array(s2.length);
    for (var i = 0; i < s2.length; i++) u[i] = s2.charCodeAt(i);
    return u;
  }
  function analizza(buf) {
    return new Promise(function (ok, ko) { new T.GLTFLoader().parse(buf.slice(0), '', ok, ko); });
  }
  /* la griglia: il pavimento percorribile piu' vicino (in altezza) a yRif
     nel punto (x, z) del mondo, o null */
  function pavimentoLab(L, x, z, yRif) {
    var g = L.griglia;
    var i = Math.round((x - L.off.x - g.x0) / g.cella), k = Math.round((z - L.off.z - g.z0) / g.cella);
    if (i < 0 || k < 0 || i >= g.nx || k >= g.nz) return null;
    var migl = null, dm = 0.5;
    for (var j = 0; j < g.piani; j++) {
      var c = (k * g.nx + i) * g.piani + j;
      if (g.H[c] === -32768 || !g.L[c]) continue;
      var h = g.H[c] / 100 + L.off.y, d = Math.abs(h - yRif);
      if (d <= dm) { dm = d; migl = h; }
    }
    return migl;
  }
  /* chiudere le celle sotto un oggetto (il banco, un apparecchio) */
  function bloccaLab(L, x, z, raggio) {
    var g = L.griglia, r = Math.ceil(raggio / g.cella);
    var i0 = Math.round((x - L.off.x - g.x0) / g.cella), k0 = Math.round((z - L.off.z - g.z0) / g.cella);
    for (var a = -r; a <= r; a++) for (var b = -r; b <= r; b++) {
      if (Math.hypot(a, b) * g.cella > raggio) continue;
      var i = i0 + a, k = k0 + b;
      if (i < 0 || k < 0 || i >= g.nx || k >= g.nz) continue;
      for (var j = 0; j < g.piani; j++) g.L[(k * g.nx + i) * g.piani + j] = 0;
    }
  }
  /* il materiale del laboratorio sotterraneo, che arriva senza texture e
     senza coordinate: le texture del gioco proiettate dai tre assi del
     mondo (pavimento sulle facce in piano, pannelli sulle pareti) */
  function materialeTriplanare(vecchio) {
    var m = new T.MeshStandardMaterial({ color: 0xc9cfd6, roughness: 0.55, metalness: 0.35, side: T.DoubleSide,
                                         vertexColors: !!vecchio.vertexColors });
    var pan = G.M.pannello && G.M.pannello.map, pav = G.M.pavimento && G.M.pavimento.map;
    if (!pan || !pav) return m;
    m.onBeforeCompile = function (sh) {
      sh.uniforms.triPannello = { value: pan };
      sh.uniforms.triPavimento = { value: pav };
      sh.vertexShader = 'varying vec3 vTriPos; varying vec3 vTriNor;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n vTriPos = (modelMatrix * vec4(position, 1.0)).xyz; vTriNor = normalize(mat3(modelMatrix) * normal);');
      sh.fragmentShader = 'uniform sampler2D triPannello; uniform sampler2D triPavimento; varying vec3 vTriPos; varying vec3 vTriNor;\n' +
        sh.fragmentShader.replace('#include <map_fragment>', [
          'vec3 bw = pow(abs(vTriNor), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);',
          'vec4 tP = texture2D(triPannello, vTriPos.zy * 0.45) * bw.x + texture2D(triPannello, vTriPos.xy * 0.45) * bw.z;',
          'vec4 tF = (vTriNor.y > 0.0 && vTriPos.y < 1.2 ? texture2D(triPavimento, vTriPos.xz * 0.5) : texture2D(triPannello, vTriPos.xz * 0.45) * 0.8) * bw.y;',
          'vec4 tTri = tP + tF; tTri.rgb = pow(tTri.rgb, vec3(2.2));',
          /* il bianco del modello originale: le texture desaturate e chiare */
          'float lTri = dot(tTri.rgb, vec3(0.299, 0.587, 0.114)); tTri.rgb = mix(vec3(lTri), tTri.rgb, 0.2) * 1.6;',
          'diffuseColor *= vec4(tTri.rgb, 1.0);'
        ].join('\n'));
    };
    return m;
  }
  function preparaMateriali(radice, nome) {
    radice.traverse(function (o) {
      if (!o.isMesh) return;
      o.castShadow = false; o.receiveShadow = !ps1();
      var ms = Array.isArray(o.material) ? o.material : [o.material];
      ms = ms.map(function (m) {
        if (ps1()) {
          var l = new T.MeshLambertMaterial({ map: m.map || null, color: m.color, transparent: m.transparent, opacity: m.opacity,
                                              side: T.DoubleSide, emissive: m.emissive || new T.Color(0), emissiveMap: m.emissiveMap || null });
          return l;
        }
        if (nome === 'underground' && /base_mat/.test(m.name || '')) return materialeTriplanare(m);
        m.envMapIntensity = 0.8;
        return m;
      });
      o.material = Array.isArray(o.material) ? ms : ms[0];
    });
  }
  /* la porta: telaio d'acciaio, battente scuro con l'oblo', la targa col
     nome del laboratorio e la luce verde */
  function costruisciPortaLab(titolo, sotto) {
    var g = new T.Group(), M = G.M;
    [-0.8, 0.8].forEach(function (x) {
      var m = new T.Mesh(G.tonda(0.16, 2.6, 0.3, 0.03), M.acciaio); m.position.set(x, 1.3, 0); g.add(m);
    });
    var arch = new T.Mesh(G.tonda(1.76, 0.22, 0.3, 0.03), M.acciaio); arch.position.y = 2.66; g.add(arch);
    var batt = new T.Mesh(G.tonda(1.44, 2.5, 0.08, 0.02), G.mat({ color: 0x2a3036, roughness: 0.5, metalness: 0.7 }));
    batt.position.set(0, 1.25, -0.04); g.add(batt);
    /* i due battenti: la fessura in mezzo e le maniglie verticali */
    var fess = new T.Mesh(G.tonda(0.03, 2.4, 0.1, 0.01), G.mat({ color: 0x0b0d0f, roughness: 0.9 }));
    fess.position.set(0, 1.25, 0); g.add(fess);
    [-0.12, 0.12].forEach(function (x) {
      var man = new T.Mesh(G.tonda(0.04, 0.5, 0.05, 0.015), M.acciaio); man.position.set(x, 1.15, 0.03); g.add(man);
    });
    var oblo = new T.Mesh(new T.CircleGeometry(0.13, 24), G.mat({ color: 0x0a2a24, emissive: 0x5ef0c4, emissiveIntensity: 0.6 }));
    oblo.position.set(-0.36, 1.65, 0.01); g.add(oblo);
    var oblo2 = oblo.clone(); oblo2.position.x = 0.36; g.add(oblo2);
    /* la striscia di sicurezza sul pavimento davanti */
    var str = new T.Mesh(G.tonda(1.7, 0.01, 0.4, 0.005), M.strisce); str.position.set(0, 0.006, 0.35); g.add(str);
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
    var q = cv.getContext('2d');
    q.fillStyle = '#0d1a17'; q.fillRect(0, 0, 512, 96);
    q.strokeStyle = '#c9a24a'; q.lineWidth = 4; q.strokeRect(4, 4, 504, 88);
    q.fillStyle = '#8fe3c4'; q.textAlign = 'center';
    q.font = 'bold 30px sans-serif'; q.fillText(titolo, 256, 44);
    q.font = '20px sans-serif'; q.fillStyle = '#c9a24a'; q.fillText(sotto, 256, 76);
    var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; tx.usaEGetta = true;
    var targa = new T.Mesh(new T.PlaneGeometry(1.6, 0.3), new T.MeshBasicMaterial({ map: tx, toneMapped: false }));
    targa.position.set(0, 2.66, 0.16); g.add(targa);
    var spia = new T.Mesh(new T.SphereGeometry(0.05, 12, 10), G.mat({ color: 0x002a10, emissive: 0x2aff7a, emissiveIntensity: 2.6 }));
    spia.position.set(0.62, 1.2, 0.05); g.add(spia);
    if (G.alone) { var al = G.alone(0x2aff7a, 0.12, 0.6); al.position.set(0.62, 1.2, 0.12); g.add(al); }
    return g;
  }
  /* il banco del laboratorio: sul bancone vero, un portaprovette con tre
     fiale accese e un anello verde; se la mappa non ha banconi, il banco
     del gioco */
  function costruisciBancoLab(L, j) {
    var g = new T.Group();
    if (j.bancoPiano) {
      var p = j.bancoPiano;
      g.position.set(p[0] + L.off.x, p[1] + L.off.y, p[2] + L.off.z);
      var base = new T.Mesh(G.tonda(0.46, 0.04, 0.18, 0.01), G.M.acciaio); base.position.y = 0.02; g.add(base);
      [['Cl', -0.14], ['Na', 0], ['O', 0.14]].forEach(function (e) {
        var col = (POTERI[e[0]] && POTERI[e[0]].colore) || 0x5eead4;
        var a = G.ampolla(e[0], col); a.gruppo.scale.setScalar(0.55); a.gruppo.position.set(e[1], 0.04, 0); g.add(a.gruppo);
        /* le etichette delle fiale, piccole: si leggono da vicino, non coprono il banco */
        if (a.etichetta) a.etichetta.scale.setScalar(0.15);
        if (a.alone) a.alone.scale.multiplyScalar(0.5);
      });
      var an = new T.Mesh(new T.TorusGeometry(0.3, 0.012, 8, 40), G.mat({ color: 0x0a2a14, emissive: 0x2aff7a, emissiveIntensity: 2 }));
      an.rotation.x = Math.PI / 2; an.position.y = 0.01; g.add(an);
      if (G.alone) { var al = G.alone(0x5ef0c4, 0.28, 0.45); al.position.y = 0.12; g.add(al); }
      L.anelloBanco = an;
    } else {
      var b = j.banco;
      g.position.set(b[0] + L.off.x, b[1] + L.off.y, b[2] + L.off.z);
      g.add(G.bancoLab());
      bloccaLab(L, g.position.x, g.position.z, 1.4);
    }
    return g;
  }
  function entraLab(o, st) {
    if (S.lab || animV.labInCarico) return;
    var nome = o.mappa;
    animV.labInCarico = true;
    avviso(t('Apertura del laboratorio…', 'Opening the laboratory…'));
    scaricaLab(nome).then(function (r) {
      return Promise.all([analizza(r[0]), Promise.resolve(r[1]), scaricaApparecchio('reattore'), scaricaApparecchio('capsula')]);
    }).then(function (r) {
      animV.labInCarico = false;
      if (!S || !mondo || schermo !== 'gioco') return;
      montaLab(nome, r[0], r[1], r[2], r[3], { x: S.pos.x, z: S.pos.z, ang: S.ang, porta: o, stanza: st });
    }).catch(function (e) {
      animV.labInCarico = false;
      avviso(t('Il laboratorio non si apre', 'The laboratory will not open'), String(e && e.message || e));
    });
  }
  function montaLab(nome, gltf, j, bufReattore, bufCapsula, ritorno) {
    var hb = daBase64(j.altezze);
    var L = {
      nome: nome, json: j, ritorno: ritorno, oggetti: [],
      griglia: { cella: j.cella, x0: j.x0, z0: j.z0, nx: j.nx, nz: j.nz, piani: j.piani,
                 H: new Int16Array(hb.buffer, 0, hb.length / 2), L: daBase64(j.libero) },
      off: { x: LAB_ORIGINE.x - j.ingresso[0], y: -j.ingresso[1], z: LAB_ORIGINE.z - j.ingresso[2] }
    };
    var radice = new T.Group();
    radice.position.set(L.off.x, L.off.y, L.off.z);
    preparaMateriali(gltf.scene, nome);
    radice.add(gltf.scene);
    L.radice = new T.Group();
    L.radice.add(radice);
    /* il banco */
    var nb = costruisciBancoLab(L, j);
    L.radice.add(nb);
    var pb = j.banco;
    L.oggetti.push({ tipo: 'banco', x: pb[0] + L.off.x, z: pb[2] + L.off.z, _nodo: nb });
    /* la porta da cui si esce: dall'ingresso, nel verso opposto al banco,
       fino al primo punto non percorribile (una parete) */
    var ing = { x: LAB_ORIGINE.x, z: LAB_ORIGINE.z };
    var vx = ing.x - (pb[0] + L.off.x), vz = ing.z - (pb[2] + L.off.z), vl = Math.hypot(vx, vz) || 1;
    vx /= vl; vz /= vl;
    var dp = 0.3;
    while (dp < 4 && pavimentoLab(L, ing.x + vx * dp, ing.z + vz * dp, 0) !== null) dp += 0.1;
    var porta = costruisciPortaLab(t('LIVELLO ', 'LEVEL ') + S.livello, t('✋ torna al livello', '✋ back to the level'));
    porta.position.set(ing.x + vx * (dp + 0.05), 0, ing.z + vz * (dp + 0.05));
    porta.rotation.y = Math.atan2(-vx, -vz);
    L.radice.add(porta);
    L.oggetti.push({ tipo: 'uscitaLab', x: ing.x + vx * Math.max(0.3, dp - 0.4), z: ing.z + vz * Math.max(0.3, dp - 0.4) });
    /* gli apparecchi: il reattore e la capsula, dove c'e' posto */
    [[bufReattore, 'reattore'], [bufCapsula, 'capsula']].forEach(function (a, k) {
      var posto = (j.posti || [])[k];
      if (!a[0] || !posto) return;
      /* la capsula e' il modello piu' pesante: solo con la grafica alta */
      if (a[1] === 'capsula' && IMP.grafica !== 'alta') return;
      analizza(a[0]).then(function (gl) {
        if (S.lab !== L) return;
        var sc2 = gl.scene; preparaMateriali(sc2, a[1]);
        var bb = new T.Box3().setFromObject(sc2), dim = bb.getSize(new T.Vector3());
        var raggio = Math.max(0.3, posto[3] - 0.15), kS = Math.min(1, raggio * 2 / Math.max(dim.x, dim.z));
        var gr = new T.Group(); sc2.scale.setScalar(kS);
        sc2.position.set(-(bb.min.x + bb.max.x) / 2 * kS, -bb.min.y * kS, -(bb.min.z + bb.max.z) / 2 * kS);
        gr.add(sc2);
        gr.position.set(posto[0] + L.off.x, posto[1] + L.off.y, posto[2] + L.off.z);
        /* il fronte dell'apparecchio verso l'ingresso, da dove arriva chi entra */
        gr.rotation.y = Math.atan2(LAB_ORIGINE.x - gr.position.x, LAB_ORIGINE.z - gr.position.z);
        L.radice.add(gr);
        bloccaLab(L, gr.position.x, gr.position.z, Math.max(dim.x, dim.z) * kS / 2 + 0.2);
      });
    });
    /* le luci della mappa nel mondo */
    L.luci = (j.luci || []).map(function (l) { return { x: l[0] + L.off.x, y: l[1] + L.off.y, z: l[2] + L.off.z }; });
    togliLab();
    scena.add(L.radice);
    labMontato = L.radice;
    mondo.radice.visible = false;
    S.lab = L;
    S.labSuolo = 0;
    S.pos.x = ing.x; S.pos.z = ing.z; S.pos.y = 0; S.vel.y = 0; S.terra = true;
    S.ang = Math.atan2(vx, vz);
    camLiscia = null;
    if (luci && luci.emi) { L.emiPrima = luci.emi.intensity; luci.emi.intensity = ps1() ? 1.0 : 0.55; }
    if (scena.fog && scena.fog.density) { L.nebbiaPrima = scena.fog.density; scena.fog.density = 0.03; }
    aggiornaLuci(true);
    var titolo = NOMI_LAB[nome] ? t(NOMI_LAB[nome][0], NOMI_LAB[nome][1]) : (j.titolo || nome);
    avviso('⚗ ' + titolo, t('il banco di sintesi è sul bancone · ✋ per usarlo', 'the synthesis bench is on the counter · ✋ to use it'));
    bip(660, 0.12, 'triangle', 0.06);
  }
  function esciLab() {
    var L = S && S.lab;
    if (!L) return;
    togliLab();
    if (luci && luci.emi && L.emiPrima != null) luci.emi.intensity = L.emiPrima;
    if (scena.fog && L.nebbiaPrima) scena.fog.density = L.nebbiaPrima;
    mondo.radice.visible = true;
    S.lab = null;
    var r = L.ritorno;
    S.pos.x = r.x; S.pos.z = r.z; S.pos.y = 0; S.vel.y = 0; S.terra = true;
    S.ang = r.ang + Math.PI;
    camLiscia = null;
    mondo.stanzaCorrente = null;
    aggiornaVisibili();
    aggiornaLuci(true);
    bip(520, 0.1, 'triangle', 0.05);
  }
  /* togliere il laboratorio dalla scena (e dalla memoria della scheda) */
  function togliLab() {
    if (labMontato && labMontato.parent) { labMontato.parent.remove(labMontato); smonta(labMontato); }
    labMontato = null;
  }
  /* il passo dentro un laboratorio: per assi separati, sulla griglia */
  function muoviInLab(dx, dz) {
    var L = S.lab, h;
    if (dx) { h = pavimentoLab(L, S.pos.x + dx, S.pos.z, S.labSuolo); if (h !== null) { S.pos.x += dx; S.labSuolo = h; } }
    if (dz) { h = pavimentoLab(L, S.pos.x, S.pos.z + dz, S.labSuolo); if (h !== null) { S.pos.z += dz; S.labSuolo = h; } }
  }

  function ricostruisci() {
    if (!scena) return;
    /* un livello che si ricostruisce chiude il laboratorio (anche quello
       di una partita precedente): si torna alla sua porta */
    togliLab();
    pulisciCombattimento(); pulisciPericoli(); pulisciGore();
    if (S && S.lab) {
      var Lr = S.lab;
      S.lab = null; S.pos.x = Lr.ritorno.x; S.pos.z = Lr.ritorno.z; S.pos.y = 0;
    }
    if (mondo && mondo.radice) { scena.remove(mondo.radice); smonta(mondo.radice); }
    mondo = costruisciMondo(S ? S.livello : 1);
  }

  /* cambiare grafica vuol dire un renderer nuovo (l'antialias si sceglie
     alla nascita) e materiali nuovi: si smonta tutto e si rimonta, e la
     partita resta dov'era — gli oggetti presi sono scritti nello stato */
  function rifai3D() {
    var inPartita = !!(S && mondo);
    if (inPartita && S.lab) { var Lq = S.lab; S.lab = null; S.pos.x = Lq.ritorno.x; S.pos.z = Lq.ritorno.z; S.pos.y = 0; S.ang = Lq.ritorno.ang + Math.PI; }
    var pos = inPartita ? { x: S.pos.x, z: S.pos.z, ang: S.ang } : null;
    fermaCiclo();
    try { if (ren) { ren.dispose(); if (ren.forceContextLoss) ren.forceContextLoss(); } } catch (e) {}
    if (tela && tela.parentNode) tela.parentNode.removeChild(tela);
    ren = null; scena = null; camera = null; tela = null; G = null; labMontato = null;
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
    var rip = S.ripresa && S.ripresa.livello === S.livello ? S.ripresa : null;
    S.ripresa = null;
    if (rip) { S.presi = Object.assign({}, rip.presi); S.fatti = Object.assign({}, rip.fatti); S.checkpoint = rip; }
    else S.checkpoint = null;
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
    if (rip) { S.pos.x = rip.x; S.pos.z = rip.z; S.ang = rip.ang || 0; }
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
        risDin.base = ps1() ? 1 : Math.min(globale.devicePixelRatio || 1, alta ? 1.5 : 1);
        prof.scala = 1;
        ren.setPixelRatio(risDin.base);
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
        creaPost();
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
        if (/^[1-9]$/.test(ev.key)) { var lp = S.inventario[+ev.key - 1]; if (lp) scegliPotere(lp.sim); }
        else if (tt === 'f') interagisci();
        else if (tt === 'x') usaRapido();
        else if (tt === 'g') { if (!ev.repeat) inizioCarica(); }
        else if (tt === 'v') pugno();
        else if (tt === 'c') { if (!ev.repeat) schiva(); }
        else if (tt === 'z') cambiaZoom();
        else if (tt === 'h') schermoIntero();
        else if (tt === 'r') cambiaInMano();
        else if (tt === 'i') { schermo = 'inventario'; fermaCiclo(); disegnaUI(); }
        else if (tt === 'k') { schermo = 'codex'; fermaCiclo(); disegnaUI(); }
        else if (ev.key === 'Escape' || tt === 'p') { schermo = 'pausa'; fermaCiclo(); disegnaUI(); }
        else if (tt === 'b') {
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
      if (ev.key === 'g' || ev.key === 'G') fineCarica();
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
      if (tela && document.pointerLockElement === tela) sguardo(e.movementX || 0, e.movementY || 0, 0.0024 * (1 - zoom * 0.5));
    });
    /* col puntatore bloccato: sinistro spara (tenendo premuto, a raffica),
       destro scatena il potere, la rotella sceglie il potere */
    var rafficaM = null;
    document.addEventListener('mousedown', function (e) {
      if (!tela || document.pointerLockElement !== tela || schermo !== 'gioco') return;
      if (e.button === 0) { usaRapido(); if (rafficaM) clearInterval(rafficaM); rafficaM = setInterval(function () { if (schermo === 'gioco') usaRapido(); }, 250); }
      else if (e.button === 2) inizioCarica();
      else if (e.button === 1) { e.preventDefault(); cambiaZoom(); }
    });
    document.addEventListener('mouseup', function (e) { if (e.button === 0 && rafficaM) { clearInterval(rafficaM); rafficaM = null; } if (e.button === 2) fineCarica(); });
    sc.addEventListener('contextmenu', function (e) { if (schermo === 'gioco') e.preventDefault(); });
    sc.addEventListener('wheel', function (e) {
      if (schermo !== 'gioco' || !S) return;
      e.preventDefault();
      scorriPotere(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
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
        sguardo(t1.clientX - tocco.x, t1.clientY - tocco.y, 0.006 * (1 - zoom * 0.5));
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
    disegna: function () { disegna(Date.now()); },
    lab: function () { return S && S.lab; },
    entraLab: function (o) { entraLab(o || null); },
    esciLab: function () { esciLab(); },
    pavimentoLab: function (x, z, y) { return S && S.lab ? pavimentoLab(S.lab, x, z, y) : null; },
    motore: function () { return { prof: prof, ren: ren, scena: scena, camera: camera, G: G, luci: luci, chimico: chimico, post: post,
                                   vista: vista, scenaMani: scenaMani, camMani: camMani, animV: animV }; },
    spruzzo: function () { spruzzo(); },
    sparo: function () { CD.sparo = 0; sparo(); },
    pugno: function () { CD.pugno = 0; pugno(); },
    schiva: function () { CD.schiva = 0; schiva(); },
    tieniCarica: function (on) { if (on) { CD.potere = 0; inizioCarica(); } else fineCarica(); },
    riposo: function () { mosse.finestra = 0; mosse.combo = 0; mosse.esegui = null; tempoG.fermo = tempoG.lento = 0; },
    caricaPotere: function (k) { CD.potere = 0; inizioCarica(); mosse.carica = k == null ? 1 : k; fineCarica(); },
    eseguibile: function (o) { return eseguibile(o); },
    mosse: function () { return { combo: mosse.combo, finestra: mosse.finestra, esegui: !!mosse.esegui, carica: mosse.carica, tempo: Object.assign({}, tempoG),
                                  scatto: !!(S && S.scatto), pericoli: pericoli.map(function (P) { return { tipo: P.tipo, r: P.r, t: P.t }; }) }; },
    speciale: function (o) { if (!SPECIALI[o.specie]) return false; o._fase = 'speciale'; o._sp = { fase: 'carica', t: 0 }; return true; },
    speciali: function () { return Object.keys(SPECIALI).map(function (k) { return [k, SPECIALI[k].nome]; }); },
    torcia: function () { return !!(luci && luci.torcia); },
    abbatti: function (o) { if (o && o.vivo) abbattiNemico(o, posNemico(o)); },
    orda: function () { var st = null; if (mondo) mondo.zona.stanze.forEach(function (x) { if (x._orda) st = x; }); return st ? { id: st.id, x: st.x, z: st.z, larg: st.larg, prof: st.prof, ondate: st._orda.ondate, ondata: st._orda.ondata, finita: st._orda.finita, attiva: S.orda === st,
                                       vivi: st.oggetti.filter(function (o) { return o._orda && o.vivo; }).length } : null; },
    gore: function () { return { macchie: macchieV.length, brandelli: brandelli.length, archi: archi.length }; },
    degrado: function () { var n = 0; if (mondo) mondo.zona.stanze.forEach(function (x) { if (x._degrado) n += x._degrado; }); return n; },
    reazioni: function () { return Object.assign({}, S.reazioni || {}); },
    pozza: function (x, z) { var P = pericolo({ x: x, z: z, r: 1.6, tipo: 'pozza', ritardo: 0.01, durata: 6, col: 0x8fe36b, nome: ['prova', 'test'] }); P.t = 0.02; return !!P; },
    ferito: function (p) { S.immune = 0; danno(p || '—'); },
    variante: function (o) { return variante(o); },
    specieNemici: function () { return Object.keys(SPECIE_M); },
    usaPotere: function () { CD.potere = 0; usaPotere(); },
    scegliPotere: function (x) { scegliPotere(x); },
    zoom: function (v) { cambiaZoom(v); return zoom; },
    schermoIntero: function (v) { schermoIntero(v); },
    nelMirino: function () { return nelMirino(16); },
    combattimento: function () { return { proiettili: proiettili.length, effetti: effetti.length, nubi: nubi.length }; },
    lancio: function () { lancio(); },
    sguardo: function (dx, dy) { sguardo(dx, dy, 0.0024); },
    TRAMA: TRAMA, ascolta: function (id) { ascolta(id); }, nastro: function () { return nastro; },
    versione: '2.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
