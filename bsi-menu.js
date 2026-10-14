/* ═══════════════════════════════════════════════════════════════════════════
   BSI MENU — Utility nel MENU PRINCIPALE, e una strada sola per ogni cosa

   LA STORIA DI QUESTO FILE, PERCHE' SPIEGA COM'E' FATTO ADESSO

   Prima questo modulo faceva l'opposto: nascondeva la categoria «🛠️ Utility»
   dalla barra di navigazione e ne portava le diciotto voci dentro il menù ✨,
   perche' occupavano una categoria intera e spingevano fuori schermo quelle
   che si usano piu' spesso.

   Il risultato pratico, però, e' stato che le stesse cose si trovavano in
   DUE posti. Non per un errore di questo file: perche' il pannello ✨ ha
   anche un suo elenco CABLATO di voci — editor, laboratori, strumenti — e
   alcune di quelle voci aprivano esattamente le stesse sezioni che il
   modulo stava inserendo. Nel pannello comparivano due «Data Science», due
   «File Manager», due «Articoli», due «Aggiornamenti». Chi guardava vedeva
   ripetizioni, e aveva ragione.

   ADESSO LA REGOLA E' UNA SOLA E SI PUO' CONTROLLARE

     se una cosa ha un pulsante VISIBILE nella barra, NON sta nel menù ✨;
     se non ce l'ha — gli strumenti in sovrapposizione, i laboratori, le
     azioni come «stampa» o «condividi» — sta solo nel menù ✨.

   Quindi: la categoria Utility torna nella barra con tutte le sue voci, e
   questo modulo non inserisce piu' nessuna riga di sezione nel pannello.
   Il suo lavoro e' diventato il contrario di prima: TENERE la categoria
   visibile (altro codice la ricostruisce, e l'ha nascosta per versioni) e
   togliere dalla barra le due voci che hanno una casa migliore altrove.

   LE DUE ECCEZIONI, ED ENTRAMBE HANNO UN MOTIVO

   · `sai` (Spectra) resta FUORI dalla barra: ha un pulsante dedicato suo,
     che pulsa in basso a destra. Tre strade per il copilota erano troppe.
   · `sspettrolettore` resta FUORI dalla barra: e' una scheda del Centro
     spettri, e il Centro spettri ha il suo pulsante. Averlo anche qui ne
     faceva la decima strada per una cosa che ha gia' un posto suo.

   In entrambi i casi il pulsante resta NEL DOCUMENTO, nascosto: decine di
   punti dell'applicazione aprono una sezione con `goSection()`, che e'
   `[data-s=...]`.click(). Nascosto si', rimosso no.

   USO   si innesta da se'; `BSIMenu` per il banco.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* Le voci che la categoria Utility deve mostrare nella barra. L'ordine è
     quello a cui chi usa l'applicazione è abituato, con «Articoli» in testa
     perché è la novità e perché è la più generica. */
  var UTILITY = ['sarticoli', 'slab', 'sghs', 'smap', 'scompare', 'spubchem',
    'sdiagrammi', 'srisorse', 'smateriali', 'snotes', 'sfilemanager',
    'sstats', 'sdatasci', 'spomo', 'slabcalc'];
  var LINGUE = ['slingua', 'slinguaggi'];

  /* Le due che NON devono stare nella barra, e perché (vedi l'intestazione). */
  var FUORI = {
    sai: 'ha il suo pulsante dedicato',
    sspettrolettore: 'è una scheda del Centro spettri'
  };

  function t(it, en) {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? en : it;
  }

  function pulsanteDi(sid) {
    return document.querySelector('.nav-btn[data-s="' + sid + '"]');
  }

  /* ── 1. la categoria torna, e resta, nella barra ──────────────────────── */
  function mostraCategoria() {
    var tab = document.querySelector('.nav-group-tab[data-group="6"]');
    var pan = document.getElementById('navGroup6');
    if (tab) {
      /* Per diverse versioni questo modulo scriveva `display:none` qui. Altro
         codice ricostruisce la barra e rimette lo stile originale, quindi non
         basta togliere la riga: va rimosso l'attributo, e va rifatto a tratti
         perché la barra può essere ricostruita dopo di noi. */
      tab.style.removeProperty('display');
      tab.removeAttribute('aria-hidden');
      tab.tabIndex = 0;
    }
    if (pan) {
      pan.removeAttribute('aria-hidden');
      pan.removeAttribute('data-bsi-spostato');
      /* il pannello di un gruppo non attivo è `display:none` per progetto:
         non si forza, lo gestisce `switchNavGroup()` */
    }
    return !!(tab && pan);
  }

  /* ── 2. le due che hanno una casa migliore escono dalla barra ─────────── */
  function nascondiLeDue() {
    var n = 0;
    Object.keys(FUORI).forEach(function (sid) {
      var b = pulsanteDi(sid);
      if (!b) return;
      b.style.display = 'none';
      b.setAttribute('aria-hidden', 'true');
      b.setAttribute('data-bsi-fuori', FUORI[sid]);
      b.tabIndex = -1;
      n++;
    });
    return n;
  }

  /* ── 3. il pannello ✨ non deve ripetere la barra ─────────────────────
     Questo modulo non inserisce più righe. Ma nel pannello c'è un elenco
     CABLATO, scritto altrove, e qualche sua voce apre una sezione che ora
     ha un pulsante visibile: sarebbero due strade. Si tolgono, misurando
     invece di indovinare — si guarda se la sezione che aprono ha un
     pulsante visibile, non si tiene un elenco di nomi da aggiornare a mano. */
  /* «VISIBILE NELLA BARRA» NON SI MISURA CON `offsetParent`.
     Nella barra un solo gruppo per volta è mostrato: il pannello degli altri
     sei è `display:none` per progetto. Quindi un pulsante perfettamente
     raggiungibile — basta cambiare linguetta — ha `offsetParent` nullo, e la
     prima stesura di questa funzione concludeva che la barra non lo
     mostrava: non toglieva nessuna ripetizione e le quattro restavano tutte.
     La domanda giusta è un'altra: il pulsante è nascosto DI SUO, o è
     soltanto in un gruppo che adesso non è aperto? */
  function nellaBarra(sid) {
    var b = pulsanteDi(sid);
    if (!b) return false;
    if (getComputedStyle(b).display === 'none') return false;
    var pan = b.closest ? b.closest('.nav-group-panel') : null;
    if (!pan) return true;                /* fuori dai gruppi: sempre in vista */
    var n = pan.id && pan.id.replace('navGroup', '');
    var tab = document.querySelector('.nav-group-tab[data-group="' + n + '"]');
    /* raggiungibile se la sua linguetta esiste e si vede */
    return !!(tab && getComputedStyle(tab).display !== 'none');
  }

  /* UNA REGOLA SUL NOME SBAGLIA QUANDO IL NOME INGANNA.
     La regola «se la chiave si chiama come una sezione, apre quella sezione»
     funziona per `datasci`→`sdatasci` e per `sarticoli`, e ha sbagliato su
     `filemanager`: quella chiave NON apre la sezione `sfilemanager` — apre
     `file_manager.html` in sovrapposizione, che è la pagina protetta da
     password, una cosa diversa con un nome simile. Nascondendola come
     «ripetizione» si perdeva una funzione.
     Le eccezioni stanno scritte qui con il motivo, invece di essere
     indovinate: una regola che non si può spiegare non si può correggere. */
  var NON_E_LA_SEZIONE = {
    filemanager: 'apre la pagina protetta in sovrapposizione, non la sezione degli appunti'
  };

  function APRE_SEZIONE(chiave) {
    if (NON_E_LA_SEZIONE[chiave]) return null;
    /* le chiavi cablate che aprono una sezione dell'applicazione: la chiave
       è il nome della sezione, con o senza la «s» iniziale */
    if (document.getElementById(chiave)) return chiave;
    if (document.getElementById('s' + chiave)) return 's' + chiave;
    return null;
  }

  function togliRipetizioni() {
    var pan = document.getElementById('bsi14-panel');
    if (!pan) return 0;
    var tolte = 0;
    [].forEach.call(pan.querySelectorAll('[data-key]'), function (r) {
      var sid = APRE_SEZIONE(r.getAttribute('data-key'));
      if (!sid) return;
      /* se la barra lo mostra, il menù non lo ripete */
      if (nellaBarra(sid)) {
        r.style.display = 'none';
        r.setAttribute('aria-hidden', 'true');
        r.setAttribute('data-bsi-ripetuto', sid);
        tolte++;
      }
    });
    /* e le voci con la STESSA etichetta: due righe che dicono la stessa
       parola sono una ripetizione anche se dietro hanno chiavi diverse.
       Resta la prima. */
    var viste = {};
    [].forEach.call(pan.querySelectorAll('[data-key]'), function (r) {
      if (r.style.display === 'none') return;
      var nodo = r.querySelector('.bsi14-nm') || r;
      var nome = (nodo.textContent || '').trim().toLowerCase();
      if (!nome) return;
      if (viste[nome]) {
        r.style.display = 'none';
        r.setAttribute('aria-hidden', 'true');
        r.setAttribute('data-bsi-ripetuto', 'etichetta: ' + nome);
        tolte++;
      } else viste[nome] = true;
    });
    return tolte;
  }

  /* ── 4. quando ───────────────────────────────────────────────────────── */
  function applica() {
    mostraCategoria();
    nascondiLeDue();
    return togliRipetizioni();
  }

  var osservatore = null;
  function sorveglia() {
    if (document.getElementById('bsi14-panel')) { togliRipetizioni(); return; }
    if (osservatore) return;
    osservatore = new MutationObserver(function () {
      if (document.getElementById('bsi14-panel')) {
        togliRipetizioni();
        osservatore.disconnect();
        osservatore = null;
      }
    });
    osservatore.observe(document.body, { childList: true, subtree: false });
  }

  function avvia() {
    mostraCategoria();
    nascondiLeDue();
    sorveglia();
    /* il clic sul ✨ costruisce il pannello: subito dopo si ripulisce */
    document.addEventListener('click', function (e) {
      var f = e.target && e.target.closest ? e.target.closest('#bsi14-fab') : null;
      if (!f) return;
      setTimeout(togliRipetizioni, 40);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else avvia();
  /* la barra può essere ricostruita da altro codice, e per versioni l'ha
     ricostruita NASCOSTA: si riapplica a tratti nei primi secondi */
  [300, 900, 2000, 4000].forEach(function (ms) {
    setTimeout(function () { mostraCategoria(); nascondiLeDue(); }, ms);
  });

  document.addEventListener('bsi-lingua', function () {
    if (document.getElementById('bsi14-panel')) togliRipetizioni();
  });

  globale.BSIMenu = {
    UTILITY: UTILITY, LINGUE: LINGUE, FUORI: FUORI,
    NON_E_LA_SEZIONE: NON_E_LA_SEZIONE,
    applica: applica, mostraCategoria: mostraCategoria,
    nascondiLeDue: nascondiLeDue, togliRipetizioni: togliRipetizioni,
    /* per il banco: che cosa è dove, misurato nel documento */
    stato: function () {
      var pan = document.getElementById('bsi14-panel');
      var tab = document.querySelector('.nav-group-tab[data-group="6"]');
      var visibile = nellaBarra;
      var vociPannello = pan ? [].filter.call(pan.querySelectorAll('[data-key]'),
        function (r) { return getComputedStyle(r).display !== 'none'; }) : [];
      return {
        categoriaVisibile: !!(tab && getComputedStyle(tab).display !== 'none'),
        utilityNellaBarra: UTILITY.filter(visibile).length,
        utilityTotali: UTILITY.length,
        lingueNellaBarra: LINGUE.filter(visibile).length,
        /* le due fuori: nel documento ma non nella barra */
        fuoriDallaBarra: Object.keys(FUORI).filter(function (s) {
          return !!pulsanteDi(s) && !visibile(s); }).length,
        /* il menù non ripete la barra */
        vociPannelloVisibili: vociPannello.length,
        ripetizioniTolte: pan ? pan.querySelectorAll('[data-bsi-ripetuto]').length : 0,
        /* e nessuna voce visibile del pannello apre una sezione che la barra
           mostra già: è la regola, misurata */
        ripetizioniRimaste: vociPannello.filter(function (r) {
          var sid = APRE_SEZIONE(r.getAttribute('data-key'));
          return !!(sid && visibile(sid)); }).map(function (r) {
            return r.getAttribute('data-key'); }),
        /* né due voci visibili con la stessa etichetta */
        etichetteDoppie: (function () {
          var c = {}, out = [];
          vociPannello.forEach(function (r) {
            var nodo = r.querySelector('.bsi14-nm') || r;
            var n = (nodo.textContent || '').trim().toLowerCase();
            if (!n) return;
            c[n] = (c[n] || 0) + 1;
          });
          Object.keys(c).forEach(function (k) { if (c[k] > 1) out.push(k); });
          return out;
        })(),
        /* nessuna riga di sezione inserita da qui: non le inserisce più */
        righeDiSezione: pan ? pan.querySelectorAll('.bsiMenu-sp').length : 0
      };
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
